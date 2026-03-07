"use client";

import React, { useCallback, useEffect, useRef } from "react";
import {
    ReactFlow,
    Background,
    MiniMap,
    Controls,
    useReactFlow,
    type Node,
    type NodeTypes,
    type EdgeTypes,
    BackgroundVariant,
    SelectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/base.css";

import { useWorkflowBuilderStore } from "@/store/useWorkflowBuilderStore";
import { TriggerNode } from "./nodes/TriggerNode";
import { AgentNode } from "./nodes/AgentNode";
import { PromptNode } from "./nodes/PromptNode";
import { ToolNode } from "./nodes/ToolNode";
import { ConditionNode } from "./nodes/ConditionNode";
import { TransformNode } from "./nodes/TransformNode";
import { OutputNode } from "./nodes/OutputNode";
import { SummitNode } from "./nodes/SummitNode";
import { GroupNode } from "./nodes/GroupNode";
import { DelayNode } from "./nodes/DelayNode";
import { DataEdge } from "./edges/DataEdge";
import { ExecutingEdge } from "./edges/ExecutingEdge";
import { ConditionalEdge } from "./edges/ConditionalEdge";

const nodeTypes: NodeTypes = {
    trigger: TriggerNode,
    agent: AgentNode,
    prompt: PromptNode,
    tool: ToolNode,
    condition: ConditionNode,
    transform: TransformNode,
    output: OutputNode,
    summit: SummitNode,
    group: GroupNode,
    delay: DelayNode,
};

const edgeTypes: EdgeTypes = {
    data: DataEdge,
    executing: ExecutingEdge,
    conditional: ConditionalEdge,
};

const defaultEdgeOptions = { type: "data", animated: false };
const connectionLineStyle = { stroke: "var(--accent-base)", strokeWidth: 2 };

const minimapStyle: React.CSSProperties = {
    background: "oklch(0.1 0.005 0 / 0.6)",
    backdropFilter: "blur(12px)",
    borderRadius: 10,
    border: "1px solid oklch(1 0 0 / 0.08)",
    overflow: "hidden",
};

function nodeColor(node: Node) {
    const m: Record<string, string> = {
        trigger: "oklch(0.78 0.17 135)", agent: "oklch(0.75 0.18 55)",
        prompt: "oklch(0.55 0.14 290)", tool: "oklch(0.72 0.14 195)",
        condition: "oklch(0.65 0.19 25)", transform: "oklch(0.55 0.15 232)",
        output: "oklch(0.75 0.18 55)", summit: "oklch(0.55 0.14 290)",
        group: "oklch(0.55 0.15 232)", delay: "oklch(0.65 0.19 25)",
    };
    return m[node.type || ""] || "oklch(0.5 0 0)";
}

export default function WorkflowCanvas() {
    const nodes = useWorkflowBuilderStore((s) => s.nodes);
    const edges = useWorkflowBuilderStore((s) => s.edges);
    const onNodesChange = useWorkflowBuilderStore((s) => s.onNodesChange);
    const onEdgesChange = useWorkflowBuilderStore((s) => s.onEdgesChange);
    const onConnect = useWorkflowBuilderStore((s) => s.onConnect);
    const setSelectedNode = useWorkflowBuilderStore((s) => s.setSelectedNode);
    const removeSelectedNodes = useWorkflowBuilderStore((s) => s.removeSelectedNodes);
    const setFavoritesModalOpen = useWorkflowBuilderStore((s) => s.setFavoritesModalOpen);
    const setHoveredGroupId = useWorkflowBuilderStore((s) => s.setHoveredGroupId);
    const addNodesToGroup = useWorkflowBuilderStore((s) => s.addNodesToGroup);
    const autoResizeGroup = useWorkflowBuilderStore((s) => s.autoResizeGroup);
    const hoveredGroupIdRef = useRef<string | null>(null);
    const { getNodes } = useReactFlow();

    const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedNode(node.id);
    }, [setSelectedNode]);

    const handlePaneClick = useCallback(() => {
        setSelectedNode(null);
    }, [setSelectedNode]);

    // Delete key support
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Delete" || e.key === "Backspace") {
                const active = document.activeElement;
                if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || (active as HTMLElement).isContentEditable)) return;
                removeSelectedNodes();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [removeSelectedNodes]);

    // Double-click on pane = open favorites
    const handleDoubleClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setFavoritesModalOpen(true);
    }, [setFavoritesModalOpen]);

    // ─── Node drag: detect hover-over-group OR auto-resize parent group ──────
    const handleNodeDrag = useCallback((_event: React.MouseEvent, draggedNode: Node) => {
        if (draggedNode.type === "group") return;

        const allNodes = useWorkflowBuilderStore.getState().nodes;

        // Case 1: Free node — check if hovering over any group for glow
        if (!draggedNode.parentId) {
            const groups = allNodes.filter((n) => n.type === "group");
            const dragW = draggedNode.measured?.width || 200;
            const dragH = draggedNode.measured?.height || 80;
            const dragCx = draggedNode.position.x + dragW / 2;
            const dragCy = draggedNode.position.y + dragH / 2;

            let foundGroup: string | null = null;
            for (const g of groups) {
                const gw = Number(g.style?.width) || 300;
                const gh = Number(g.style?.height) || 200;
                if (
                    dragCx > g.position.x &&
                    dragCx < g.position.x + gw &&
                    dragCy > g.position.y &&
                    dragCy < g.position.y + gh
                ) {
                    foundGroup = g.id;
                    break;
                }
            }

            if (foundGroup !== hoveredGroupIdRef.current) {
                hoveredGroupIdRef.current = foundGroup;
                setHoveredGroupId(foundGroup);
            }
            return;
        }

        // Case 2: Child node — auto-expand parent group if dragged beyond bounds
        autoResizeGroup(draggedNode.parentId);
    }, [setHoveredGroupId, autoResizeGroup]);

    // ─── Node drag stop: drop-to-group OR finalize child auto-resize ─────────
    const handleNodeDragStop = useCallback((_event: React.MouseEvent, draggedNode: Node) => {
        const hgId = hoveredGroupIdRef.current;

        // Drop free node onto group
        if (hgId && draggedNode.type !== "group" && !draggedNode.parentId) {
            // Build absolute position map using draggedNode.position as authoritative source
            const absPositions: Record<string, { x: number; y: number }> = {};
            const draggedIds: string[] = [];

            // Primary dragged node — position comes directly from ReactFlow's callback (always correct)
            absPositions[draggedNode.id] = { ...draggedNode.position };
            draggedIds.push(draggedNode.id);

            // Other selected nodes — get from getNodes() for the best available positions
            const rfNodes = getNodes();
            for (const rfn of rfNodes) {
                if (rfn.id !== draggedNode.id && rfn.selected && rfn.type !== "group" && !rfn.parentId) {
                    absPositions[rfn.id] = { ...rfn.position };
                    draggedIds.push(rfn.id);
                }
            }

            addNodesToGroup(draggedIds, hgId, absPositions);
        }

        // Finalize group auto-resize after child drag
        if (draggedNode.parentId) {
            autoResizeGroup(draggedNode.parentId);
        }

        hoveredGroupIdRef.current = null;
        setHoveredGroupId(null);
    }, [addNodesToGroup, setHoveredGroupId, autoResizeGroup]);

    return (
        <div style={{ width: "100%", height: "100%" }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={handleNodeClick}
                onPaneClick={handlePaneClick}
                onNodeDrag={handleNodeDrag}
                onNodeDragStop={handleNodeDragStop}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                connectionLineStyle={connectionLineStyle}
                snapToGrid={true}
                snapGrid={[20, 20]}
                fitView
                fitViewOptions={{ maxZoom: 1 }}
                proOptions={{ hideAttribution: true }}
                selectionMode={SelectionMode.Partial}
                panOnDrag={[1]}
                selectionOnDrag={true}
                selectNodesOnDrag={true}
                deleteKeyCode={null}
                onDoubleClick={handleDoubleClick}
                zoomOnDoubleClick={false}
            >
                <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="oklch(1 0 0 / 0.06)" />
                <MiniMap style={minimapStyle} nodeColor={nodeColor} maskColor="oklch(0 0 0 / 0.5)" position="bottom-right" />
                <Controls position="bottom-left" showInteractive={false} style={{
                    background: "oklch(0.1 0.005 0 / 0.6)", backdropFilter: "blur(12px)",
                    borderRadius: 10, border: "1px solid oklch(1 0 0 / 0.08)", overflow: "hidden",
                }} />
            </ReactFlow>
        </div>
    );
}
