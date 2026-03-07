import { create } from 'zustand';
import {
    type Node,
    type Edge,
    type OnNodesChange,
    type OnEdgesChange,
    type OnConnect,
    type Connection,
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
} from '@xyflow/react';

export type WfNodeExecStatus = 'idle' | 'queued' | 'running' | 'success' | 'error';

export interface ExecutionLogEntry {
    nodeId: string;
    timestamp: number;
    type: 'info' | 'error' | 'output';
    message: string;
}

export interface WorkflowMeta {
    id: string;
    name: string;
    description: string;
    masteryScore: number;
    streak: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Cleanly strip all group-parenting props from a node.
 * Setting `parentId: undefined` leaves the key present — ReactFlow still sees it.
 * Destructuring + omitting is the only safe way.
 */
function unparentNode(node: Node, groupPos: { x: number; y: number }): Node {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { parentId, extent, expandParent, ...cleanNode } = node as Node & { parentId?: string; extent?: unknown; expandParent?: boolean };
    return {
        ...cleanNode,
        position: {
            x: node.position.x + groupPos.x,
            y: node.position.y + groupPos.y,
        },
    };
}

/** Make a node a child of a group. NO extent:'parent' — we handle containment manually. */
function parentNode(node: Node, groupId: string, groupPos: { x: number; y: number }): Node {
    return {
        ...node,
        parentId: groupId,
        position: {
            x: node.position.x - groupPos.x,
            y: node.position.y - groupPos.y,
        },
        selected: false,
    };
}

/** Compute group size that fits all children with padding. */
function computeGroupSize(children: Node[], padding = 40, headerH = 36) {
    if (children.length === 0) return { width: 300, height: 200 };
    let maxW = 0, maxH = 0;
    for (const c of children) {
        maxW = Math.max(maxW, c.position.x + (c.measured?.width || 200) + padding);
        maxH = Math.max(maxH, c.position.y + (c.measured?.height || 80) + padding);
    }
    return { width: Math.max(maxW, 250), height: Math.max(maxH, headerH + 80) };
}

// ─── State Interface ─────────────────────────────────────────────────────────

interface WorkflowBuilderState {
    nodes: Node[];
    edges: Edge[];
    selectedNodeId: string | null;
    isExecuting: boolean;
    executionState: Record<string, WfNodeExecStatus>;
    executionLog: ExecutionLogEntry[];
    nodePaletteOpen: boolean;
    nodePaletteSearch: string;
    configPanelOpen: boolean;
    favoritesModalOpen: boolean;
    favoriteNodes: Set<string>;
    hoveredGroupId: string | null;
    workflowMeta: WorkflowMeta;
    isDirty: boolean;
    canUndo: boolean;
    canRedo: boolean;

    setNodes: (nodes: Node[]) => void;
    setEdges: (edges: Edge[]) => void;
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    addNode: (node: Node) => void;
    removeNode: (id: string) => void;
    removeSelectedNodes: () => void;
    updateNodeData: (id: string, data: Record<string, unknown>) => void;
    duplicateNode: (id: string) => void;
    setSelectedNode: (id: string | null) => void;
    setConfigPanelOpen: (open: boolean) => void;
    startExecution: () => void;
    updateNodeExecution: (nodeId: string, status: WfNodeExecStatus) => void;
    addExecutionLog: (entry: ExecutionLogEntry) => void;
    completeExecution: () => void;
    togglePalette: () => void;
    setPaletteOpen: (open: boolean) => void;
    setSearch: (query: string) => void;
    setFavoritesModalOpen: (open: boolean) => void;
    toggleFavorite: (key: string) => void;
    createGroupFromSelection: () => void;
    addNodesToGroup: (nodeIds: string[], groupId: string, absPositions: Record<string, { x: number; y: number }>) => void;
    setHoveredGroupId: (id: string | null) => void;
    autoResizeGroup: (groupId: string) => void;
    fitGroupToChildren: (groupId: string) => void;
    setWorkflowMeta: (meta: Partial<WorkflowMeta>) => void;
    setDirty: (dirty: boolean) => void;
    hydrate: (nodes: Node[], edges: Edge[], meta: WorkflowMeta) => void;
    reset: () => void;
}

const INITIAL_META: WorkflowMeta = {
    id: '',
    name: 'Untitled Workflow',
    description: '',
    masteryScore: 0,
    streak: 0,
};

// ─── Store ───────────────────────────────────────────────────────────────────

export const useWorkflowBuilderStore = create<WorkflowBuilderState>((set, get) => ({
    nodes: [],
    edges: [],
    selectedNodeId: null,
    isExecuting: false,
    executionState: {},
    executionLog: [],
    nodePaletteOpen: false,
    nodePaletteSearch: '',
    configPanelOpen: false,
    favoritesModalOpen: false,
    favoriteNodes: new Set<string>(),
    hoveredGroupId: null,
    workflowMeta: { ...INITIAL_META },
    isDirty: false,
    canUndo: false,
    canRedo: false,

    setNodes: (nodes) => set({ nodes, isDirty: true }),
    setEdges: (edges) => set({ edges, isDirty: true }),
    onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes), isDirty: true }),
    onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges), isDirty: true }),
    onConnect: (connection: Connection) => {
        const edgeType = connection.sourceHandle?.startsWith('condition-') || connection.sourceHandle?.startsWith('summit-')
            ? 'conditional' : 'data';
        const labelMap: Record<string, string> = {
            'condition-true': 'TRUE', 'condition-false': 'FALSE',
            'summit-text': 'TEXT', 'summit-exec': 'EXEC',
        };
        set({
            edges: addEdge({
                ...connection,
                type: edgeType,
                data: { label: labelMap[connection.sourceHandle || ''] },
            }, get().edges),
            isDirty: true,
        });
    },

    addNode: (node) => set({ nodes: [...get().nodes, node], isDirty: true }),

    // ─── Remove: cleanly unparent children if removing a group ───────────────
    removeNode: (id) => {
        const nodes = get().nodes;
        const removedNode = nodes.find((n) => n.id === id);

        if (removedNode?.type === 'group') {
            const groupPos = removedNode.position;
            const updatedNodes = nodes
                .filter((n) => n.id !== id)
                .map((n) => n.parentId === id ? unparentNode(n, groupPos) : n);
            set({
                nodes: updatedNodes,
                edges: get().edges.filter((e) => e.source !== id && e.target !== id),
                selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
                configPanelOpen: get().selectedNodeId === id ? false : get().configPanelOpen,
                isDirty: true,
            });
            return;
        }

        // Normal node removal
        const childIds = nodes.filter((n) => n.parentId === id).map((n) => n.id);
        const idsToRemove = [id, ...childIds];
        set({
            nodes: nodes.filter((n) => !idsToRemove.includes(n.id)),
            edges: get().edges.filter((e) => !idsToRemove.includes(e.source) && !idsToRemove.includes(e.target)),
            selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
            configPanelOpen: get().selectedNodeId === id ? false : get().configPanelOpen,
            isDirty: true,
        });
    },

    removeSelectedNodes: () => {
        const nodes = get().nodes;
        const selectedIds = nodes.filter((n) => n.selected).map((n) => n.id);
        if (selectedIds.length === 0) return;

        // For each selected group, cleanly unparent non-selected children
        const groupsBeingRemoved = nodes.filter((n) => n.selected && n.type === 'group');
        let updatedNodes = [...nodes];
        for (const group of groupsBeingRemoved) {
            updatedNodes = updatedNodes.map((n) => {
                if (n.parentId === group.id && !n.selected) {
                    return unparentNode(n, group.position);
                }
                return n;
            });
        }

        set({
            nodes: updatedNodes.filter((n) => !n.selected),
            edges: get().edges.filter((e) => !selectedIds.includes(e.source) && !selectedIds.includes(e.target)),
            selectedNodeId: null,
            configPanelOpen: false,
            isDirty: true,
        });
    },

    updateNodeData: (id, data) => set({
        nodes: get().nodes.map((n) => n.id === id ? { ...n, data: { ...n.data, ...data } } : n),
        isDirty: true,
    }),

    duplicateNode: (id) => {
        const node = get().nodes.find((n) => n.id === id);
        if (!node) return;
        set({
            nodes: [...get().nodes, {
                ...node, id: `${node.type}-${Date.now()}`,
                position: { x: node.position.x + 40, y: node.position.y + 40 },
                selected: false,
            }],
            isDirty: true,
        });
    },

    setSelectedNode: (id) => set({ selectedNodeId: id, configPanelOpen: id !== null }),
    setConfigPanelOpen: (open) => set({ configPanelOpen: open, selectedNodeId: open ? get().selectedNodeId : null }),

    startExecution: () => {
        const execState: Record<string, WfNodeExecStatus> = {};
        get().nodes.forEach((n) => { execState[n.id] = 'queued'; });
        set({ isExecuting: true, executionState: execState, executionLog: [] });
    },
    updateNodeExecution: (nodeId, status) => set({ executionState: { ...get().executionState, [nodeId]: status } }),
    addExecutionLog: (entry) => set({ executionLog: [...get().executionLog, entry] }),
    completeExecution: () => set({ isExecuting: false }),

    togglePalette: () => set({ nodePaletteOpen: !get().nodePaletteOpen }),
    setPaletteOpen: (open) => set({ nodePaletteOpen: open }),
    setSearch: (query) => set({ nodePaletteSearch: query }),
    setFavoritesModalOpen: (open) => set({ favoritesModalOpen: open }),
    toggleFavorite: (key) => {
        const favs = new Set(get().favoriteNodes);
        if (favs.has(key)) favs.delete(key); else favs.add(key);
        set({ favoriteNodes: favs });
    },
    setHoveredGroupId: (id) => set({ hoveredGroupId: id }),

    // ─── Group from selection ────────────────────────────────────────────────
    createGroupFromSelection: () => {
        const nodes = get().nodes;
        const selected = nodes.filter((n) => n.selected && n.type !== 'group' && !n.parentId);
        if (selected.length < 2) return;

        const PADDING = 40;
        const HEADER = 36;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const n of selected) {
            minX = Math.min(minX, n.position.x);
            minY = Math.min(minY, n.position.y);
            maxX = Math.max(maxX, n.position.x + (n.measured?.width || 200));
            maxY = Math.max(maxY, n.position.y + (n.measured?.height || 80));
        }

        const groupId = `group-${Date.now()}`;
        const groupX = minX - PADDING;
        const groupY = minY - PADDING - HEADER;

        const groupNode: Node = {
            id: groupId,
            type: 'group',
            position: { x: groupX, y: groupY },
            style: { width: maxX - minX + PADDING * 2, height: maxY - minY + PADDING * 2 + HEADER },
            data: { label: 'Group' },
            zIndex: -1,
            dragHandle: '.drag-handle',
        };

        const updatedNodes = nodes.map((n) => {
            if (selected.find((s) => s.id === n.id)) {
                return parentNode(n, groupId, { x: groupX, y: groupY });
            }
            return n;
        });

        set({
            nodes: [groupNode, ...updatedNodes],
            selectedNodeId: groupId,
            configPanelOpen: true,
            isDirty: true,
        });
    },

    // ─── Add nodes to existing group (bounding-box approach) ──────────────────
    addNodesToGroup: (nodeIds: string[], groupId: string, absPositions: Record<string, { x: number; y: number }>) => {
        const nodes = get().nodes;
        const group = nodes.find((n) => n.id === groupId);
        if (!group) return;

        const PADDING = 40;
        const HEADER = 36;

        // Collect absolute positions for ALL nodes in this group (existing children + new)
        const existingChildren = nodes.filter((n) => n.parentId === groupId);
        const allAbsPositions: { id: string; x: number; y: number; w: number; h: number }[] = [];

        // Existing children: convert from group-relative to absolute
        for (const c of existingChildren) {
            allAbsPositions.push({
                id: c.id,
                x: c.position.x + group.position.x,
                y: c.position.y + group.position.y,
                w: c.measured?.width || 200,
                h: c.measured?.height || 80,
            });
        }

        // New nodes: use the authoritative absolute positions
        for (const nid of nodeIds) {
            const node = nodes.find((n) => n.id === nid);
            if (!node || node.type === 'group') continue;
            const abs = absPositions[nid] || node.position;
            allAbsPositions.push({
                id: nid,
                x: abs.x,
                y: abs.y,
                w: node.measured?.width || 200,
                h: node.measured?.height || 80,
            });
        }

        if (allAbsPositions.length === 0) return;

        // Compute bounding box of all children (absolute coordinates)
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of allAbsPositions) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x + p.w);
            maxY = Math.max(maxY, p.y + p.h);
        }

        // New group position and size to encompass ALL children
        const newGroupX = minX - PADDING;
        const newGroupY = minY - PADDING - HEADER;
        const newGroupW = maxX - minX + PADDING * 2;
        const newGroupH = maxY - minY + PADDING * 2 + HEADER;

        // Update all nodes
        const allChildIds = allAbsPositions.map((p) => p.id);
        const absMap = Object.fromEntries(allAbsPositions.map((p) => [p.id, p]));

        const updatedNodes = nodes.map((n) => {
            if (n.id === groupId) {
                return {
                    ...n,
                    position: { x: newGroupX, y: newGroupY },
                    style: { ...n.style, width: newGroupW, height: newGroupH },
                };
            }
            if (allChildIds.includes(n.id)) {
                const abs = absMap[n.id];
                return {
                    ...n,
                    parentId: groupId,
                    position: { x: abs.x - newGroupX, y: abs.y - newGroupY },
                    selected: false,
                };
            }
            return n;
        });

        set({ nodes: updatedNodes, hoveredGroupId: null, isDirty: true });
    },

    // ─── Fit group to its children (auto-fit button) ───────────────────────
    fitGroupToChildren: (groupId: string) => {
        const nodes = get().nodes;
        const group = nodes.find((n) => n.id === groupId);
        if (!group) return;

        const children = nodes.filter((n) => n.parentId === groupId);
        if (children.length === 0) return;

        const PADDING = 40;
        const HEADER = 36;

        // Get children's absolute positions
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const c of children) {
            const ax = c.position.x + group.position.x;
            const ay = c.position.y + group.position.y;
            minX = Math.min(minX, ax);
            minY = Math.min(minY, ay);
            maxX = Math.max(maxX, ax + (c.measured?.width || 200));
            maxY = Math.max(maxY, ay + (c.measured?.height || 80));
        }

        const newGroupX = minX - PADDING;
        const newGroupY = minY - PADDING - HEADER;
        const newGroupW = maxX - minX + PADDING * 2;
        const newGroupH = maxY - minY + PADDING * 2 + HEADER;

        set({
            nodes: nodes.map((n) => {
                if (n.id === groupId) {
                    return {
                        ...n,
                        position: { x: newGroupX, y: newGroupY },
                        style: { ...n.style, width: newGroupW, height: newGroupH },
                    };
                }
                if (n.parentId === groupId) {
                    const ax = n.position.x + group.position.x;
                    const ay = n.position.y + group.position.y;
                    return {
                        ...n,
                        position: { x: ax - newGroupX, y: ay - newGroupY },
                    };
                }
                return n;
            }),
            isDirty: true,
        });
    },

    // ─── Auto-resize group to fit children — ALL directions ────────────────────
    autoResizeGroup: (groupId: string) => {
        const nodes = get().nodes;
        const group = nodes.find((n) => n.id === groupId);
        if (!group) return;

        const children = nodes.filter((n) => n.parentId === groupId);
        if (children.length === 0) return;

        const PADDING = 40;

        // Find bounding box of all children (relative to group origin)
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const c of children) {
            minX = Math.min(minX, c.position.x);
            minY = Math.min(minY, c.position.y);
            maxX = Math.max(maxX, c.position.x + (c.measured?.width || 200));
            maxY = Math.max(maxY, c.position.y + (c.measured?.height || 80));
        }

        const curW = Number(group.style?.width) || 300;
        const curH = Number(group.style?.height) || 200;

        // Shift needed for left/up expansion (negative child positions)
        const shiftX = minX < PADDING ? PADDING - minX : 0;
        const shiftY = minY < PADDING ? PADDING - minY : 0;

        // New required dimensions
        const needW = maxX + shiftX + PADDING;
        const needH = maxY + shiftY + PADDING;

        const newW = Math.max(needW, curW);
        const newH = Math.max(needH, curH);

        // Check if anything changed
        const sizeChanged = newW !== curW || newH !== curH;
        const posChanged = shiftX > 0 || shiftY > 0;

        if (!sizeChanged && !posChanged) return;

        set({
            nodes: nodes.map((n) => {
                if (n.id === groupId) {
                    return {
                        ...n,
                        position: {
                            x: n.position.x - shiftX,
                            y: n.position.y - shiftY,
                        },
                        style: { ...n.style, width: newW, height: newH },
                    };
                }
                // Offset all children to compensate for group shift
                if (n.parentId === groupId && posChanged) {
                    return {
                        ...n,
                        position: {
                            x: n.position.x + shiftX,
                            y: n.position.y + shiftY,
                        },
                    };
                }
                return n;
            }),
        });
    },

    setWorkflowMeta: (meta) => set({ workflowMeta: { ...get().workflowMeta, ...meta }, isDirty: true }),
    setDirty: (dirty) => set({ isDirty: dirty }),

    hydrate: (nodes, edges, meta) => set({
        nodes, edges, workflowMeta: meta, selectedNodeId: null, configPanelOpen: false,
        isExecuting: false, executionState: {}, executionLog: [],
        nodePaletteOpen: false, nodePaletteSearch: '', isDirty: false, favoritesModalOpen: false,
        hoveredGroupId: null,
    }),

    reset: () => set({
        nodes: [], edges: [], selectedNodeId: null, configPanelOpen: false,
        isExecuting: false, executionState: {}, executionLog: [],
        nodePaletteOpen: false, nodePaletteSearch: '', workflowMeta: { ...INITIAL_META },
        isDirty: false, favoritesModalOpen: false, hoveredGroupId: null,
    }),
}));
