"use client";

import React from "react";
import {
    BaseEdge,
    getBezierPath,
    EdgeLabelRenderer,
    type EdgeProps,
} from "@xyflow/react";

function ConditionalEdgeInner({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
}: EdgeProps) {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const label = (data?.label as string) || "";
    const isTrue = label === "TRUE";
    const color = isTrue ? "oklch(0.6 0.15 145)" : "oklch(0.6 0.15 25)";

    return (
        <>
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    stroke: color,
                    strokeWidth: 2,
                    strokeDasharray: "8 4",
                    ...style,
                }}
            />
            {label && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: "absolute",
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            pointerEvents: "none",
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            color: color,
                            background: "oklch(0.1 0 0 / 0.8)",
                            padding: "2px 6px",
                            borderRadius: 4,
                            border: `1px solid ${color}`,
                        }}
                    >
                        {label}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
}

export const ConditionalEdge = React.memo(ConditionalEdgeInner);
