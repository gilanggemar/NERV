"use client";

import React from "react";
import {
    BaseEdge,
    getBezierPath,
    type EdgeProps,
    EdgeLabelRenderer,
} from "@xyflow/react";

function DataEdgeInner({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
}: EdgeProps) {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    return (
        <>
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    stroke: "var(--wf-edge-default)",
                    strokeWidth: 2,
                    transition: "stroke 200ms ease",
                    ...style,
                }}
            />
        </>
    );
}

export const DataEdge = React.memo(DataEdgeInner);
