"use client";
import React from "react";
import { type NodeProps } from "@xyflow/react";
import { MessageSquare } from "lucide-react";
import { BaseNode } from "./BaseNode";
import { NODE_ACCENTS } from "./nodeStyles";

function PromptNodeInner({ id, data, selected }: NodeProps) {
    const text = (data.promptText as string) || "";
    const preview = text.length > 50 ? text.slice(0, 50) + "…" : text;
    const vars = (text.match(/\{\{.*?\}\}/g) || []).length;

    return (
        <BaseNode
            nodeId={id} selected={!!selected} accent={NODE_ACCENTS.prompt}
            icon={<MessageSquare size={14} />}
            label={(data.label as string) || "Prompt"}
        >
            {preview && (
                <div style={{
                    fontSize: 9, color: "var(--text-secondary)", lineHeight: 1.3,
                    overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical"
                }}>
                    {preview}
                </div>
            )}
            {vars > 0 && (
                <div style={{
                    display: "inline-flex", padding: "1px 5px", borderRadius: 3,
                    background: "oklch(1 0 0 / 0.06)", fontSize: 8, color: NODE_ACCENTS.prompt, fontWeight: 500, marginTop: 3
                }}>
                    {vars} var{vars !== 1 ? "s" : ""}
                </div>
            )}
        </BaseNode>
    );
}

export const PromptNode = React.memo(PromptNodeInner);
