"use client";

import dynamic from "next/dynamic";

const AgentConstellation = dynamic(
    () => import("@/components/AgentConstellation"),
    { ssr: false, loading: () => <div className="w-full h-full flex flex-col items-center justify-center nerv-glass-2 rounded-xl text-muted-foreground animate-pulse">Loading Constellation...</div> }
);

const testAgents: any[] = [
    { id: 'daisy', name: 'Daisy', type: 'openclaw', tasksCompleted: 47, isActive: true, status: 'online' },
    { id: 'ivy', name: 'Ivy', type: 'openclaw', tasksCompleted: 82, isActive: false, status: 'online' },
    { id: 'celia', name: 'Celia', type: 'openclaw', tasksCompleted: 23, isActive: true, status: 'online' },
    { id: 'thalia', name: 'Thalia', type: 'openclaw', tasksCompleted: 61, isActive: false, status: 'online' },
    { id: 'agent-zero', name: 'Agent Zero', type: 'external', tasksCompleted: 5, isActive: false, status: 'offline' },
];

const testEdges: any[] = [
    { source: 'daisy', target: 'ivy', weight: 0.8, type: 'collaboration' },
    { source: 'daisy', target: 'celia', weight: 0.3, type: 'delegation' },
    { source: 'ivy', target: 'thalia', weight: 0.6, type: 'collaboration' },
    { source: 'celia', target: 'thalia', weight: 0.4, type: 'summit' },
    { source: 'daisy', target: 'agent-zero', weight: 0.1, type: 'delegation' },
];

export default function ConstellationPage() {
    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                        🌌 Agent Constellation
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">
                        Real-time visualization of agent relationships and collaboration networks.
                    </p>
                </div>
            </div>

            <div className="flex-1 min-h-[500px]">
                <AgentConstellation
                    agents={testAgents}
                    edges={testEdges}
                    className="w-full h-full nerv-glass-2"
                />
            </div>
        </div>
    );
}
