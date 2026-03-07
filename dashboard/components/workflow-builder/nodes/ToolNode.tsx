"use client";
import React from "react";
import { type NodeProps } from "@xyflow/react";
import { Wrench } from "lucide-react";
import { BaseNode } from "./BaseNode";
import { NODE_ACCENTS } from "./nodeStyles";

function ToolNodeInner({ id, data, selected }: NodeProps) {
    return (
        <BaseNode nodeId={id} selected={!!selected} accent={NODE_ACCENTS.tool}
            icon={<Wrench size={14} />}
            label={(data.toolName as string) || (data.label as string) || "Tool"}
            subtitle={(data.serverName as string) || ""} />
    );
}

export const ToolNode = React.memo(ToolNodeInner);
