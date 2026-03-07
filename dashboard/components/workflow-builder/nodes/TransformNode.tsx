"use client";
import React from "react";
import { type NodeProps } from "@xyflow/react";
import { Code } from "lucide-react";
import { BaseNode } from "./BaseNode";
import { NODE_ACCENTS } from "./nodeStyles";

function TransformNodeInner({ id, data, selected }: NodeProps) {
    const lang = (data.language as string) || "JS";
    const code = (data.code as string) || "";
    const lines = code.split("\n").slice(0, 2);

    return (
        <BaseNode nodeId={id} selected={!!selected} accent={NODE_ACCENTS.transform}
            icon={<Code size={14} />} label={(data.label as string) || "Transform"}>
            <div style={{ display: "flex", gap: 4, marginBottom: 3 }}>
                <span style={{
                    padding: "1px 5px", borderRadius: 3, background: "oklch(1 0 0 / 0.06)",
                    fontSize: 8, fontWeight: 600, color: NODE_ACCENTS.transform, textTransform: "uppercase"
                }}>
                    {lang}
                </span>
            </div>
            {lines[0] && (
                <div className="nerv-mono" style={{
                    fontSize: 8, lineHeight: 1.3, color: "var(--text-muted)",
                    overflow: "hidden", maxHeight: 28, padding: "3px 5px", borderRadius: 4, background: "oklch(0 0 0 / 0.2)"
                }}>
                    {lines.map((l, i) => (
                        <div key={i} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l}</div>
                    ))}
                </div>
            )}
        </BaseNode>
    );
}

export const TransformNode = React.memo(TransformNodeInner);
