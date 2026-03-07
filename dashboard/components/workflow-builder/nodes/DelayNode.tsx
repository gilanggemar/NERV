"use client";
import React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Timer } from "lucide-react";
import { useWorkflowBuilderStore, type WfNodeExecStatus } from "@/store/useWorkflowBuilderStore";
import { NODE_ACCENTS, EXEC_STATUS_COLORS, NODE_DIMENSIONS, getHandleStyle } from "./nodeStyles";
import { motion } from "framer-motion";

function DelayNodeInner({ id, data, selected }: NodeProps) {
    const execStatus = useWorkflowBuilderStore((s) => s.executionState[id] ?? "idle") as WfNodeExecStatus;
    const isRunning = execStatus === "running";
    const statusColor = EXEC_STATUS_COLORS[execStatus];
    const accent = NODE_ACCENTS.delay;
    const borderColor = selected || isRunning ? "var(--accent-coral)" : "transparent";

    const delayMs = (data.delayMs as number) || 1000;
    const label = delayMs >= 1000 ? `${delayMs / 1000}s` : `${delayMs}ms`;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            style={{
                minWidth: NODE_DIMENSIONS.minWidth,
                padding: NODE_DIMENSIONS.padding,
                borderRadius: NODE_DIMENSIONS.borderRadius,
                background: "oklch(0.13 0.005 0 / 0.75)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: `1.5px solid ${borderColor}`,
                boxShadow: selected ? "var(--wf-node-shadow-selected)" : "var(--wf-node-shadow)",
                transition: "border-color 200ms ease, box-shadow 200ms ease",
                position: "relative",
            }}
        >
            <div style={{
                position: "absolute", top: 8, right: 8, width: 6, height: 6,
                borderRadius: "50%", background: statusColor,
                animation: isRunning ? "wf-pulse 1.5s ease-in-out infinite" : undefined,
            }} />

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                    width: 24, height: 24, borderRadius: 6,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "oklch(0.65 0.19 25 / 0.15)",
                    color: "var(--accent-coral)", flexShrink: 0,
                }}>
                    <Timer size={14} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                        color: "var(--text-primary)", fontSize: 10, fontWeight: 600,
                        letterSpacing: "0.06em", textTransform: "uppercase",
                    }}>
                        {(data.label as string) || "Delay"}
                    </div>
                    <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 1 }}>
                        Wait {label}
                    </div>
                </div>
            </div>

            <Handle type="target" position={Position.Left} style={getHandleStyle("var(--accent-coral)")} />
            <Handle type="source" position={Position.Right} style={getHandleStyle("var(--accent-coral)")} />
        </motion.div>
    );
}

export const DelayNode = React.memo(DelayNodeInner);
