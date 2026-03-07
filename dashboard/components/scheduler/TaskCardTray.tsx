'use client';

import { useState, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Search, InboxIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { TaskCard } from './TaskCard';
import { useTaskStore, type Task } from '@/lib/useTaskStore';
import { useSchedulerStore } from '@/store/useSchedulerStore';
import { useSocketStore } from '@/lib/useSocket';

// ─── Agent color helper ─────────────────────────────────────────────────────

function getAgentColor(agentId: string): string {
    const lower = agentId.toLowerCase();
    if (lower.includes('daisy')) return 'var(--agent-daisy)';
    if (lower.includes('ivy')) return 'var(--agent-ivy)';
    if (lower.includes('celia')) return 'var(--agent-celia)';
    if (lower.includes('thalia')) return 'var(--agent-thalia)';
    if (lower.includes('zero')) return 'var(--agent-zero)';
    return 'var(--accent-base)';
}

// ─── Draggable task wrapper ─────────────────────────────────────────────────

function DraggableTrayTask({ task }: { task: Task }) {
    const agents = useSocketStore((s) => s.agents);
    const agent = agents.find((a: any) => a.id === task.agentId);

    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `tray-${task.id}`,
        data: { type: 'tray-task', task },
    });

    return (
        <div ref={setNodeRef} {...attributes} {...listeners}>
            <TaskCard
                id={task.id}
                title={task.title}
                agentId={task.agentId}
                agentName={agent?.name || task.agentId}
                agentColor={getAgentColor(task.agentId)}
                priority={task.priority?.toLowerCase() as 'low' | 'medium' | 'high' | 'critical' || 'medium'}
                status="PENDING"
                description={task.description}
                isDragging={isDragging}
                isCompact={false}
            />
        </div>
    );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function TaskCardTray() {
    const [searchQuery, setSearchQuery] = useState('');
    const tasks = useTaskStore((s) => s.tasks);
    const events = useSchedulerStore((s) => s.events);

    // Filter: PENDING tasks that don't have a scheduler event
    const unscheduledTasks = useMemo(() => {
        const scheduledTaskIds = new Set(
            events.filter(e => e.taskId).map(e => e.taskId)
        );

        return tasks
            .filter(t => t.status === 'PENDING' && !scheduledTaskIds.has(t.id))
            .filter(t => {
                if (!searchQuery) return true;
                return t.title.toLowerCase().includes(searchQuery.toLowerCase());
            });
    }, [tasks, events, searchQuery]);

    return (
        <div className="nerv-glass-1 w-64 border-r border-white/[0.06] flex flex-col h-full shrink-0">
            {/* Header */}
            <div className="px-3 py-3 border-b border-white/[0.06] shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="nerv-section-prominent">Unscheduled Tasks</h3>
                    <span className="nerv-badge-text bg-white/[0.08] px-2 py-0.5 rounded-full">
                        {unscheduledTasks.length}
                    </span>
                </div>
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-40" />
                    <Input
                        placeholder="Filter tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-7 text-xs pl-7 bg-white/[0.04] border-white/[0.06]"
                    />
                </div>
            </div>

            {/* Task list */}
            <div className="flex-1 overflow-y-auto p-2">
                {unscheduledTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 opacity-40">
                        <InboxIcon className="w-8 h-8" />
                        <div className="nerv-caption text-center">
                            {searchQuery ? 'No matching tasks' : 'All tasks scheduled! 🎯'}
                        </div>
                    </div>
                ) : (
                    unscheduledTasks.map((task) => (
                        <DraggableTrayTask key={task.id} task={task} />
                    ))
                )}
            </div>
        </div>
    );
}
