"use client";

import React from "react";
import {
    BaseEdge,
    getBezierPath,
    type EdgeProps,
} from "@xyflow/react";

function ExecutingEdgeInner({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
}: EdgeProps) {
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const gradientId = `exec-grad-${sourceX}-${targetX}`;
    const particleId = `exec-particle-${sourceX}-${targetX}`;

    return (
        <>
            <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--wf-edge-active)" stopOpacity="0.2" />
                    <stop offset="50%" stopColor="var(--wf-edge-active)" stopOpacity="1" />
                    <stop offset="100%" stopColor="var(--wf-edge-active)" stopOpacity="0.2" />
                </linearGradient>
            </defs>
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    stroke: `url(#${gradientId})`,
                    strokeWidth: 3,
                    filter: "drop-shadow(0 0 6px oklch(0.75 0.18 55))",
                    ...style,
                }}
            />
            {/* Animated particle along the edge */}
            <circle r="4" fill="var(--wf-edge-active)" filter="url(#glow)">
                <animateMotion dur="1.2s" repeatCount="indefinite" path={edgePath} />
            </circle>
            <circle r="2" fill="white" opacity="0.8">
                <animateMotion dur="1.2s" repeatCount="indefinite" path={edgePath} />
            </circle>
        </>
    );
}

export const ExecutingEdge = React.memo(ExecutingEdgeInner);
