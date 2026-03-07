"use client";
import React from "react";
import { type NodeProps } from "@xyflow/react";
import { Bot } from "lucide-react";
import { BaseNode } from "./BaseNode";
import { NODE_ACCENTS } from "./nodeStyles";

function AgentNodeInner({ id, data, selected }: NodeProps) {
    const agentColor = (data.agentColor as string) || NODE_ACCENTS.agent;
    return (
        <BaseNode
            nodeId={id}
            selected={!!selected}
            accent={agentColor}
            icon={<Bot size={14} />}
            label={(data.agentName as string) || (data.label as string) || "Agent"}
            subtitle={(data.provider as string) || "OpenClaw"}
            showInput={true}
            showOutput={true}
        >
            <div style={{
                display: "inline-flex", padding: "1px 6px", borderRadius: 4,
                background: "oklch(1 0 0 / 0.06)", fontSize: 8, fontWeight: 500,
                color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em",
            }}>
                {(data.provider as string) || "OpenClaw"}
            </div>
        </BaseNode>
    );
}

export const AgentNode = React.memo(AgentNodeInner);
