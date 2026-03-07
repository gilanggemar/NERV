"use client";
import React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Users } from "lucide-react";
import { useWorkflowBuilderStore, type WfNodeExecStatus } from "@/store/useWorkflowBuilderStore";
import { NODE_ACCENTS, EXEC_STATUS_COLORS, NODE_DIMENSIONS, getHandleStyle } from "./nodeStyles";
import { motion } from "framer-motion";

function SummitNodeInner({ id, data, selected }: NodeProps) {
    const execStatus = useWorkflowBuilderStore((s) => s.executionState[id] ?? "idle") as WfNodeExecStatus;
    const isRunning = execStatus === "running";
    const statusColor = EXEC_STATUS_COLORS[execStatus];
    const accent = NODE_ACCENTS.summit;
    const borderColor = selected || isRunning ? accent : "transparent";

    const agents = (data.agents as string[]) || [];
    const topic = (data.topic as string) || "";
    const rounds = (data.rounds as number) || 3;

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
                    background: `color-mix(in oklch, ${accent} 15%, transparent)`,
                    color: accent, flexShrink: 0,
                }}>
                    <Users size={14} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                        color: "var(--text-primary)", fontSize: 10, fontWeight: 600,
                        letterSpacing: "0.06em", textTransform: "uppercase",
                    }}>
                        {(data.label as string) || "Summit"}
                    </div>
                    {agents.length > 0 && (
                        <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 1 }}>
                            {agents.length} agent{agents.length !== 1 ? "s" : ""} · {rounds} round{rounds !== 1 ? "s" : ""}
                        </div>
                    )}
                </div>
            </div>

            {topic && (
                <div style={{
                    fontSize: 9, color: "var(--text-secondary)", marginTop: 5,
                    lineHeight: 1.3, overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                }}>
                    {topic}
                </div>
            )}

            {/* Dual output labels */}
            <div style={{ display: "flex", gap: 6, marginTop: 6, paddingLeft: 30 }}>
                <span style={{
                    fontSize: 7, fontWeight: 700, color: accent,
                    textTransform: "uppercase", letterSpacing: "0.06em",
                    padding: "1px 4px", borderRadius: 3,
                    background: `color-mix(in oklch, ${accent} 10%, transparent)`,
                }}>TEXT</span>
                <span style={{
                    fontSize: 7, fontWeight: 700, color: "var(--accent-teal)",
                    textTransform: "uppercase", letterSpacing: "0.06em",
                    padding: "1px 4px", borderRadius: 3,
                    background: "oklch(0.72 0.14 195 / 0.1)",
                }}>EXEC</span>
            </div>

            <Handle type="target" position={Position.Left} style={getHandleStyle(accent)} />
            <Handle type="source" position={Position.Right} id="summit-text"
                style={{ ...getHandleStyle(accent), top: "35%" }} />
            <Handle type="source" position={Position.Right} id="summit-exec"
                style={{ ...getHandleStyle("var(--accent-teal)"), top: "70%" }} />
        </motion.div>
    );
}

export const SummitNode = React.memo(SummitNodeInner);
