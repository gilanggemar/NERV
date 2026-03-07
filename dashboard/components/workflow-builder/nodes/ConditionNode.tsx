"use client";
import React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { GitBranch } from "lucide-react";
import { useWorkflowBuilderStore, type WfNodeExecStatus } from "@/store/useWorkflowBuilderStore";
import { NODE_ACCENTS, EXEC_STATUS_COLORS, NODE_DIMENSIONS, getHandleStyle } from "./nodeStyles";
import { motion } from "framer-motion";

function ConditionNodeInner({ id, data, selected }: NodeProps) {
    const expression = (data.expression as string) || "condition";
    const preview = expression.length > 25 ? expression.slice(0, 25) + "…" : expression;
    const execStatus = useWorkflowBuilderStore((s) => s.executionState[id] ?? "idle") as WfNodeExecStatus;
    const isRunning = execStatus === "running";
    const statusColor = EXEC_STATUS_COLORS[execStatus];
    const accent = NODE_ACCENTS.condition;
    const borderColor = selected || isRunning ? accent : "transparent";

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
            {/* Status dot */}
            <div style={{
                position: "absolute", top: 8, right: 8, width: 6, height: 6,
                borderRadius: "50%", background: statusColor,
                animation: isRunning ? "wf-pulse 1.5s ease-in-out infinite" : undefined,
            }} />

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                    width: 24, height: 24, borderRadius: 6,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: `color-mix(in oklch, ${accent} 15%, transparent)`,
                    color: accent, flexShrink: 0,
                }}>
                    <GitBranch size={14} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                        color: "var(--text-primary)", fontSize: 10, fontWeight: 600,
                        letterSpacing: "0.06em", textTransform: "uppercase",
                    }}>
                        {(data.label as string) || "Condition"}
                    </div>
                    <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 1 }}>
                        {preview}
                    </div>
                </div>
            </div>

            {/* True / False output labels */}
            <div style={{ display: "flex", gap: 8, marginTop: 6, paddingLeft: 30 }}>
                <span style={{
                    fontSize: 8, fontWeight: 700, color: "oklch(0.65 0.17 145)",
                    textTransform: "uppercase", letterSpacing: "0.08em",
                    padding: "1px 5px", borderRadius: 3,
                    background: "oklch(0.65 0.17 145 / 0.1)",
                }}>TRUE</span>
                <span style={{
                    fontSize: 8, fontWeight: 700, color: "oklch(0.65 0.19 25)",
                    textTransform: "uppercase", letterSpacing: "0.08em",
                    padding: "1px 5px", borderRadius: 3,
                    background: "oklch(0.65 0.19 25 / 0.1)",
                }}>FALSE</span>
            </div>

            {/* Handles */}
            <Handle type="target" position={Position.Left} style={getHandleStyle(accent)} />
            <Handle type="source" position={Position.Right} id="condition-true"
                style={{ ...getHandleStyle("oklch(0.65 0.17 145)"), top: "35%" }} />
            <Handle type="source" position={Position.Right} id="condition-false"
                style={{ ...getHandleStyle("oklch(0.65 0.19 25)"), top: "70%" }} />
        </motion.div>
    );
}

export const ConditionNode = React.memo(ConditionNodeInner);
