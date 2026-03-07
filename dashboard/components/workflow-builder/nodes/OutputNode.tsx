"use client";
import React from "react";
import { type NodeProps } from "@xyflow/react";
import { Flag } from "lucide-react";
import { BaseNode } from "./BaseNode";
import { NODE_ACCENTS } from "./nodeStyles";

function OutputNodeInner({ id, data, selected }: NodeProps) {
    return (
        <BaseNode nodeId={id} selected={!!selected} accent={NODE_ACCENTS.output}
            icon={<Flag size={14} />}
            label={(data.label as string) || "Output"}
            subtitle={(data.outputType as string) || "Webhook"}
            showInput={true} showOutput={false} />
    );
}

export const OutputNode = React.memo(OutputNodeInner);
