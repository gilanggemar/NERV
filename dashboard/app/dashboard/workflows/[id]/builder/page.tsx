"use client";

import React, { useEffect, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { useWorkflowBuilderStore } from "@/store/useWorkflowBuilderStore";
import WorkflowCanvas from "@/components/workflow-builder/WorkflowCanvas";
import CanvasToolbar from "@/components/workflow-builder/CanvasToolbar";
import NodePalette from "@/components/workflow-builder/NodePalette";
import NodeConfigPanel from "@/components/workflow-builder/NodeConfigPanel";
import ExecutionLog from "@/components/workflow-builder/ExecutionLog";
import FavoritesModal from "@/components/workflow-builder/FavoritesModal";

export default function WorkflowBuilderPage() {
    const params = useParams();
    const workflowId = params?.id as string;
    const hydrate = useWorkflowBuilderStore((s) => s.hydrate);
    const reset = useWorkflowBuilderStore((s) => s.reset);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!workflowId) return;

        async function load() {
            try {
                const res = await fetch(`/api/workflows/${workflowId}`);
                if (!res.ok) {
                    hydrate([], [], {
                        id: workflowId,
                        name: "New Workflow",
                        description: "",
                        masteryScore: 0,
                        streak: 0,
                    });
                    return;
                }
                const wf = await res.json();
                hydrate([], [], {
                    id: wf.id,
                    name: wf.name || "Untitled Workflow",
                    description: wf.description || "",
                    masteryScore: 0,
                    streak: 0,
                });
            } catch {
                hydrate([], [], {
                    id: workflowId,
                    name: "New Workflow",
                    description: "",
                    masteryScore: 0,
                    streak: 0,
                });
            } finally {
                setLoading(false);
            }
        }

        load();
        return () => { reset(); };
    }, [workflowId, hydrate, reset]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Loading workflow…
            </div>
        );
    }

    return (
        <ReactFlowProvider>
            <div className="flex flex-col h-full gap-3">
                {/* Header row */}
                <div className="flex items-center gap-3 shrink-0">
                    <Link
                        href="/dashboard/workflows"
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft size={13} />
                        Workflows
                    </Link>
                </div>

                {/* Canvas in Constellation-style glass frame */}
                <div className="flex-1 min-h-0 nerv-glass-2 rounded-xl overflow-hidden relative">
                    <WorkflowCanvas />
                    <CanvasToolbar />
                    <NodePalette />
                    <NodeConfigPanel />
                    <ExecutionLog />
                    <FavoritesModal />
                </div>
            </div>
        </ReactFlowProvider>
    );
}
