"use client";
import React, { useCallback, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Zap, Clock, Globe, Radio, Send, Play, MousePointerClick } from "lucide-react";
import { useWorkflowBuilderStore, type WfNodeExecStatus } from "@/store/useWorkflowBuilderStore";
import { NODE_ACCENTS, EXEC_STATUS_COLORS, NODE_DIMENSIONS, getHandleStyle } from "./nodeStyles";
import { motion } from "framer-motion";

const TRIGGER_ICONS: Record<string, React.ReactNode> = {
    Manual: <Zap size={14} />,
    Schedule: <Clock size={14} />,
    Webhook: <Globe size={14} />,
    Event: <Radio size={14} />,
};

function TriggerNodeInner({ id, data, selected }: NodeProps) {
    const isExecuting = useWorkflowBuilderStore((s) => s.isExecuting);
    const execStatus = useWorkflowBuilderStore((s) => s.executionState[id] ?? "idle") as WfNodeExecStatus;
    const addExecutionLog = useWorkflowBuilderStore((s) => s.addExecutionLog);
    const updateNodeExecution = useWorkflowBuilderStore((s) => s.updateNodeExecution);
    const isRunning = execStatus === "running";
    const statusColor = EXEC_STATUS_COLORS[execStatus];
    const accent = NODE_ACCENTS.trigger;
    const borderColor = selected || isRunning ? accent : "transparent";

    const triggerType = (data.triggerType as string) || "Manual";
    const manualMode = (data.manualMode as string) || "click";
    const [messageInput, setMessageInput] = useState("");
    const promptText = (data.promptText as string) || "";

    const handleTriggerFire = useCallback(() => {
        updateNodeExecution(id, "running");
        addExecutionLog({ nodeId: id, timestamp: Date.now(), type: "info", message: `🔥 ${triggerType} trigger fired` });
        setTimeout(() => updateNodeExecution(id, "success"), 800);
    }, [id, triggerType, updateNodeExecution, addExecutionLog]);

    const handleMessageSend = useCallback(() => {
        if (!messageInput.trim()) return;
        updateNodeExecution(id, "running");
        addExecutionLog({ nodeId: id, timestamp: Date.now(), type: "info", message: `💬 Message trigger: "${messageInput}"` });
        setMessageInput("");
        setTimeout(() => updateNodeExecution(id, "success"), 800);
    }, [id, messageInput, updateNodeExecution, addExecutionLog]);

    // Execution-mode UI for Manual triggers
    const renderExecutionUI = () => {
        if (!isExecuting || triggerType !== "Manual") return null;

        switch (manualMode) {
            case "click":
                return (
                    <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={handleTriggerFire}
                        style={{
                            marginTop: 6, width: "100%", padding: "8px 0", borderRadius: 8,
                            border: "none", background: accent, color: "#000",
                            fontSize: 10, fontWeight: 700, cursor: "pointer", letterSpacing: "0.06em",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                        }}
                    >
                        <MousePointerClick size={12} /> CLICK TO TRIGGER
                    </motion.button>
                );
            case "message":
                return (
                    <div style={{ marginTop: 6, display: "flex", gap: 4 }}>
                        <input
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleMessageSend(); }}
                            placeholder="Type message…"
                            style={{
                                flex: 1, padding: "5px 8px", borderRadius: 6,
                                border: "1px solid oklch(1 0 0 / 0.1)", background: "oklch(0 0 0 / 0.3)",
                                color: "var(--text-primary)", fontSize: 10, outline: "none",
                            }}
                        />
                        <button onClick={handleMessageSend}
                            style={{
                                padding: "4px 8px", borderRadius: 6, border: "none",
                                background: accent, color: "#000", cursor: "pointer",
                            }}>
                            <Send size={10} />
                        </button>
                    </div>
                );
            case "prompt":
                return (
                    <div style={{
                        marginTop: 6, padding: "5px 8px", borderRadius: 6,
                        background: "oklch(0 0 0 / 0.2)", fontSize: 9, color: "var(--text-muted)",
                        fontStyle: "italic", lineHeight: 1.3,
                    }}>
                        {promptText || "No prompt set"}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{
                opacity: 1,
                scale: execStatus === "success" ? [1, 1.04, 1] : 1,
                x: execStatus === "error" ? [0, -3, 3, -3, 0] : 0,
            }}
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
                    {TRIGGER_ICONS[triggerType] || <Zap size={14} />}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                        color: "var(--text-primary)", fontSize: 10, fontWeight: 600,
                        letterSpacing: "0.06em", textTransform: "uppercase",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                        {(data.label as string) || `${triggerType} Trigger`}
                    </div>
                    <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 1 }}>
                        {triggerType === "Manual" ? manualMode : triggerType}
                    </div>
                </div>
            </div>

            {renderExecutionUI()}

            <Handle type="source" position={Position.Right} style={getHandleStyle(accent)} />
        </motion.div>
    );
}

export const TriggerNode = React.memo(TriggerNodeInner);
