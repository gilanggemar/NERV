"use client";

import { useMemo } from "react";
import { useSocketStore } from "@/lib/useSocket";
import { AGENT_ROSTER } from "@/lib/agentRoster";
import { AgentCard } from "@/components/AgentCard";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AgentsPage() {
    const { agents: socketAgents } = useSocketStore();

    // Merge: AGENT_ROSTER as baseline, enriched with live socket data
    const mergedAgents = useMemo(() => {
        const result: any[] = [];

        // 1. Start with all roster agents
        for (const roster of AGENT_ROSTER) {
            // Try to find a matching socket agent by ID
            const socketMatch = socketAgents.find(
                (s: any) => s.id === roster.id || s.id === roster.codename?.toLowerCase()
            );

            if (socketMatch) {
                // Merge: socket data takes priority for live fields, roster for profile fields
                result.push({
                    ...socketMatch,
                    name: roster.name, // Use roster's display name
                    rosterProfile: roster, // Pass full profile for color/role/etc
                });
            } else {
                // No socket connection — show as offline with roster data
                result.push({
                    id: roster.id,
                    name: roster.name,
                    status: 'offline',
                    running: false,
                    connected: false,
                    configured: true,
                    rosterProfile: roster,
                });
            }
        }

        // 2. Add any socket agents NOT in the roster (e.g. external integrations)
        for (const socketAgent of socketAgents) {
            const alreadyMerged = result.some((r: any) =>
                r.id === socketAgent.id
            );
            if (!alreadyMerged) {
                result.push(socketAgent);
            }
        }

        return result;
    }, [socketAgents]);

    const onlineCount = mergedAgents.filter(
        (a: any) => a.running || a.probeOk || a.connected
    ).length;

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">Agents</h1>
                    <span className="text-xs text-muted-foreground">
                        {onlineCount} online · {mergedAgents.length} total
                    </span>
                </div>
            </div>

            <ScrollArea className="flex-1 pr-3">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 items-start gap-6 pb-4">
                    {mergedAgents.map((agent: any) => (
                        <div key={agent.id}>
                            <AgentCard agent={agent} />
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
