"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { GripVertical, AlertTriangle, Clock, CheckCircle2, PlayCircle, Flame } from "lucide-react";
import type { Task, TaskPriority } from "@/lib/useTaskStore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TaskCardProps {
    task: Task;
    onSelect?: (task: Task) => void;
}

const priorityConfig: Record<TaskPriority, { color: string; icon: typeof Flame; label: string }> = {
    CRITICAL: { color: "text-red-500 bg-red-500/10 border-red-500/30", icon: Flame, label: "CRITICAL" },
    HIGH: { color: "text-amber-500 bg-amber-500/10 border-amber-500/30", icon: AlertTriangle, label: "HIGH" },
    MEDIUM: { color: "text-blue-400 bg-blue-400/10 border-blue-400/30", icon: Clock, label: "MEDIUM" },
    LOW: { color: "text-zinc-500 bg-zinc-500/10 border-zinc-500/30", icon: Clock, label: "LOW" },
};

const statusIcon: Record<string, React.ReactNode> = {
    PENDING: <Clock className="w-3 h-3 text-zinc-500" />,
    IN_PROGRESS: <PlayCircle className="w-3 h-3 text-amber-500 animate-pulse" />,
    DONE: <CheckCircle2 className="w-3 h-3 text-emerald-500" />,
    FAILED: <AlertTriangle className="w-3 h-3 text-red-500" />,
};

export function TaskCard({ task, onSelect }: TaskCardProps) {
    const prio = priorityConfig[task.priority] || priorityConfig.MEDIUM;
    const PrioIcon = prio.icon;

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData("application/json", JSON.stringify(task));
        e.dataTransfer.effectAllowed = "move";
        // Add a visual cue
        const el = e.currentTarget as HTMLElement;
        el.style.opacity = "0.5";
    };

    const handleDragEnd = (e: React.DragEvent) => {
        const el = e.currentTarget as HTMLElement;
        el.style.opacity = "1";
    };

    return (
        <Card
            draggable={task.status === "PENDING"}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={() => onSelect?.(task)}
            className={cn(
                "group relative p-3 rounded-sm transition-all duration-200 py-3 gap-0 shadow-none",
                task.status === "PENDING"
                    ? "border-zinc-800 hover:border-zinc-600 cursor-grab active:cursor-grabbing bg-zinc-950/80"
                    : "border-zinc-800/60 opacity-75 cursor-pointer bg-zinc-950/80",
            )}
        >
            {/* Drag grip */}
            {task.status === "PENDING" && (
                <div className="absolute left-0 top-0 bottom-0 w-5 flex items-center justify-center text-zinc-700 group-hover:text-zinc-500 transition-colors">
                    <GripVertical className="w-3 h-3" />
                </div>
            )}

            <div className={cn("flex flex-col gap-1.5", task.status === "PENDING" && "ml-4")}>
                {/* Title row */}
                <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-zinc-200 font-mono leading-tight truncate flex-1">
                        {task.title}
                    </h4>
                    <div className="flex items-center gap-1 shrink-0">
                        {statusIcon[task.status]}
                    </div>
                </div>

                {/* Description preview */}
                {task.description && (
                    <p className="text-[10px] text-zinc-500 font-mono leading-snug line-clamp-2">
                        {task.description}
                    </p>
                )}

                {/* Footer: priority + agent */}
                <div className="flex items-center justify-between mt-1">
                    <Badge
                        variant="outline"
                        className={cn("inline-flex items-center gap-1 px-1.5 py-0 h-4 rounded-sm text-[9px] font-bold", prio.color)}
                    >
                        <PrioIcon className="w-2.5 h-2.5" />
                        {prio.label}
                    </Badge>
                    {task.agentId && task.agentId !== "unassigned" && (
                        <span className="text-[9px] text-zinc-500 font-mono">
                            → {task.agentId.toUpperCase()}
                        </span>
                    )}
                    {task.timestamp && (
                        <span className="text-[8px] text-zinc-600 font-mono">{task.timestamp}</span>
                    )}
                </div>
            </div>
        </Card>
    );
}
