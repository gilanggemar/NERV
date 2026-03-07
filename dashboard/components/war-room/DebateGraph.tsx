"use client";

import { useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { WarRoomEvent } from '@/lib/war-room/types';

interface DebateGraphProps {
    events: WarRoomEvent[];
    currentTime: number; // for scrubber syncing
}

export function DebateGraph({ events, currentTime }: DebateGraphProps) {
    const fgRef = useRef<any>(null);

    // Reconstruct graph state up to currentTime
    const activeEvents = events.filter(e => e.timestamp <= currentTime);

    // Basic interpretation: Agents are nodes. Links are agreements/disagreements.
    const nodesMap = new Map<string, any>();
    const links: any[] = [];

    // Default agents
    ['daisy', 'ivy', 'celia', 'thalia'].forEach(id => {
        nodesMap.set(id, { id, name: id.charAt(0).toUpperCase() + id.slice(1), val: 20 });
    });

    // Replay events to build links and node sentiments
    activeEvents.forEach(e => {
        if (e.type === 'agreement' && e.agentId && e.metadata.targetAgentId) {
            links.push({
                source: e.agentId,
                target: e.metadata.targetAgentId,
                weight: (e.metadata.weight as number) || 1
            });
        }
        if (e.type === 'position_update' && e.agentId) {
            const node = nodesMap.get(e.agentId);
            if (node) {
                node.sentiment = e.metadata.sentiment || 0; // -1 to 1
                node.stance = e.content;
            }
        }
    });

    const graphData = {
        nodes: Array.from(nodesMap.values()),
        links
    };

    useEffect(() => {
        if (fgRef.current) {
            fgRef.current.d3Force('charge').strength(-400);
            fgRef.current.d3Force('link').distance(100);
        }
    }, []);

    return (
        <div className="w-full h-full relative bg-black/5 rounded-xl border border-border overflow-hidden">
            <ForceGraph2D
                ref={fgRef}
                graphData={graphData}
                width={800} // This would ideally be auto-sized, but 800 is a safe fallback
                height={600}
                nodeLabel="name"
                nodeColor={(node: any) => {
                    if (node.sentiment > 0.5) return '#34d399'; // green (agreeing)
                    if (node.sentiment < -0.5) return '#f87171'; // red (disagreeing)
                    return '#60a5fa'; // blue (neutral/thinking)
                }}
                linkColor={(link: any) => link.weight > 0 ? 'rgba(52, 211, 153, 0.6)' : 'rgba(248, 113, 113, 0.6)'}
                linkWidth={2}
                nodeRelSize={8}
                enableNodeDrag={true}
                enableZoomInteraction={false}
            />
            {/* Absolute overlay of current stances */}
            <div className="absolute top-4 left-4 right-4 flex gap-2 pointer-events-none">
                {graphData.nodes.map(n => (
                    n.stance ? (
                        <div key={n.id} className="bg-background/80 backdrop-blur-md border border-border rounded-lg p-2 text-[10px] w-48 shadow-lg pointer-events-auto">
                            <p className="font-medium text-foreground capitalize mb-1 flex items-center gap-1">
                                <span className={`w-2 h-2 rounded-full ${n.sentiment > 0.5 ? 'bg-emerald-400' : n.sentiment < -0.5 ? 'bg-red-400' : 'bg-blue-400'}`} />
                                {n.name}
                            </p>
                            <p className="text-muted-foreground line-clamp-3">{n.stance}</p>
                        </div>
                    ) : null
                ))}
            </div>
        </div>
    );
}
