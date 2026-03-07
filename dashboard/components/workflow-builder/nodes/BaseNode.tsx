"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";
import { useWorkflowBuilderStore, type WfNodeExecStatus } from "@/store/useWorkflowBuilderStore";
import { NODE_DIMENSIONS, EXEC_STATUS_COLORS, getHandleStyle } from "./nodeStyles";

interface BaseNodeProps {
    accent: string;
    icon: React.ReactNode;
    label: string;
    subtitle?: string;
    children?: React.ReactNode;
    nodeId: string;
    selected?: boolean;
    showInput?: boolean;
    showOutput?: boolean;
    extraHandles?: React.ReactNode;
}

function BaseNodeInner({
    accent,
    icon,
    label,
    subtitle,
    children,
    nodeId,
    selected = false,
    showInput = true,
    showOutput = true,
    extraHandles,
}: BaseNodeProps) {
    const execStatus = useWorkflowBuilderStore((s) => s.executionState[nodeId] ?? "idle") as WfNodeExecStatus;
    const isRunning = execStatus === "running";
    const isSuccess = execStatus === "success";
    const isError = execStatus === "error";
    const statusColor = EXEC_STATUS_COLORS[execStatus];

    const borderColor = selected || isRunning ? accent : "transparent";
    const shadow = isRunning
        ? "var(--wf-node-shadow-executing)"
        : selected
            ? "var(--wf-node-shadow-selected)"
            : "var(--wf-node-shadow)";

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{
                opacity: 1,
                scale: isSuccess ? [1, 1.04, 1] : 1,
                x: isError ? [0, -3, 3, -3, 0] : 0,
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
                boxShadow: shadow,
                transition: "border-color 200ms ease, box-shadow 200ms ease",
                position: "relative",
            }}
        >
            {/* Status dot */}
            <div
                style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: statusColor,
                    animation: isRunning ? "wf-pulse 1.5s ease-in-out infinite" : undefined,
                    boxShadow: isRunning ? `0 0 6px ${accent}` : undefined,
                }}
            />

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                    style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: `color-mix(in oklch, ${accent} 15%, transparent)`,
                        color: accent,
                        flexShrink: 0,
                    }}
                >
                    {icon}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                        style={{
                            color: "var(--text-primary)",
                            fontSize: 10,
                            fontWeight: 600,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {label}
                    </div>
                    {subtitle && (
                        <div
                            style={{
                                fontSize: 9,
                                color: "var(--text-muted)",
                                marginTop: 1,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {subtitle}
                        </div>
                    )}
                </div>
            </div>

            {children && <div style={{ marginTop: 6 }}>{children}</div>}

            {showInput && (
                <Handle type="target" position={Position.Left} style={getHandleStyle(accent)} />
            )}
            {showOutput && !extraHandles && (
                <Handle type="source" position={Position.Right} style={getHandleStyle(accent)} />
            )}
            {extraHandles}
        </motion.div>
    );
}

export const BaseNode = React.memo(BaseNodeInner);

/* Inject keyframes once */
if (typeof document !== "undefined") {
    const id = "nerv-wf-keyframes";
    if (!document.getElementById(id)) {
        const s = document.createElement("style");
        s.id = id;
        s.textContent = `@keyframes wf-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.3)}}`;
        document.head.appendChild(s);
    }
}
