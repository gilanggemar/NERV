"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Activity, MessageSquare, Wrench, FileText, CheckCircle2,
    XCircle, Users, Zap,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AgentAvatar } from "@/components/agents/AgentAvatar";

export interface ActivityEvent {
    id: string;
    agentId: string;
    type: "chat" | "tool_call" | "task_complete" | "task_failed" | "summit" | "file_change" | "system";
    message: string;
    timestamp: number;
}

const TYPE_CONFIG: Record<string, { icon: any; color: string }> = {
    chat: { icon: MessageSquare, color: "text-blue-400" },
    tool_call: { icon: Wrench, color: "text-amber-400" },
    task_complete: { icon: CheckCircle2, color: "text-emerald-400" },
    task_failed: { icon: XCircle, color: "text-red-400" },
    summit: { icon: Users, color: "text-purple-400" },
    file_change: { icon: FileText, color: "text-cyan-400" },
    system: { icon: Zap, color: "text-muted-foreground" },
};

interface ActivityFeedProps {
    events: ActivityEvent[];
    maxItems?: number;
}

export function ActivityFeed({ events, maxItems = 50 }: ActivityFeedProps) {
    const visibleEvents = events.slice(0, maxItems);

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Activity</span>
                {events.length > 0 && (
                    <Badge variant="secondary" className="text-[9px] h-3.5 rounded px-1 font-normal ml-auto">
                        {events.length}
                    </Badge>
                )}
            </div>
            <ScrollArea className="flex-1">
                <div className="px-2 py-1">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {visibleEvents.length === 0 ? (
                            <div className="py-8 text-center text-[11px] text-muted-foreground/40">
                                No activity yet
                            </div>
                        ) : (
                            visibleEvents.map((event) => {
                                const typeCfg = TYPE_CONFIG[event.type] || TYPE_CONFIG.system;
                                const Icon = typeCfg.icon;
                                const timeStr = new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                                return (
                                    <motion.div
                                        key={event.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        className="flex items-start gap-2 py-1.5 px-1 group"
                                    >
                                        {event.agentId && event.agentId !== 'system' ? (
                                            <AgentAvatar agentId={event.agentId} size={14} className="shrink-0 mt-[1px]" />
                                        ) : (
                                            <Icon className={`w-3.5 h-3.5 ${typeCfg.color} shrink-0 mt-[1px]`} />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] text-[color:var(--text-secondary)] leading-tight break-words flex items-start gap-1">
                                                {event.agentId && event.agentId !== 'system' && (
                                                    <Icon className={`w-3 h-3 flex-shrink-0 mt-0.5 ${typeCfg.color}`} />
                                                )}
                                                <span>
                                                    <span className="font-medium capitalize">{event.agentId}</span>
                                                    {" · "}{event.message}
                                                </span>
                                            </p>
                                        </div>
                                        <span className="text-[8px] text-[color:var(--text-muted)] shrink-0 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                                            {timeStr}
                                        </span>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </div>
            </ScrollArea>
        </div>
    );
}
