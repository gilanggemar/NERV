"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Map, Send, History, CheckCircle2, Play, Pause, FastForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useWarRoomStore } from "@/store/useWarRoomStore";
import dynamic from "next/dynamic";

const ConsensusHeatmap = dynamic(
    () => import("@/components/war-room/ConsensusHeatmap").then(mod => mod.ConsensusHeatmap),
    { ssr: false }
);

const TimelineScrubber = dynamic(
    () => import("@/components/war-room/TimelineScrubber").then(mod => mod.TimelineScrubber),
    { ssr: false }
);

const ReasoningPanel = dynamic(
    () => import("@/components/war-room/ReasoningPanel").then(mod => mod.ReasoningPanel),
    { ssr: false }
);

const ConsensusScore = dynamic(
    () => import("@/components/ConsensusScore").then(mod => mod.ConsensusScore),
    { ssr: false }
);

const DebateGraph = dynamic(
    () => import("@/components/war-room/DebateGraph").then(mod => mod.DebateGraph),
    { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center bg-black/5 text-muted-foreground">Loading Graph...</div> }
);

export default function WarRoomPage() {
    const { sessions, activeSessionId, events, fetchSessions, setActiveSession, createEvent } = useWarRoomStore();
    const [humanOverride, setHumanOverride] = useState("");
    const [playbackTime, setPlaybackTime] = useState<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const playRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    useEffect(() => {
        if (sessions.length > 0 && !activeSessionId) {
            // Auto-select latest active session
            const active = sessions.find(s => s.status === 'active') || sessions[0];
            setActiveSession(active.id);
        }
    }, [sessions, activeSessionId, setActiveSession]);

    const activeSession = sessions.find(s => s.id === activeSessionId);

    // Sync playback time to latest event if not scrubbing manually
    useEffect(() => {
        if (!isPlaying && events.length > 0) {
            setPlaybackTime(events[events.length - 1].timestamp);
        }
    }, [events, isPlaying]);

    // Playback engine
    useEffect(() => {
        if (isPlaying && events.length > 0 && playbackTime !== null) {
            const endTime = events[events.length - 1].timestamp;
            if (playbackTime >= endTime) {
                setIsPlaying(false);
                return;
            }
            playRef.current = setInterval(() => {
                setPlaybackTime(prev => {
                    if (prev === null) return null;
                    const next = prev + 5000; // 5s simulation speed per tick
                    if (next >= endTime) {
                        setIsPlaying(false);
                        return endTime;
                    }
                    return next;
                });
            }, 50); // tick every 50ms
        }
        return () => { if (playRef.current) clearInterval(playRef.current); };
    }, [isPlaying, playbackTime, events]);


    const handleOverrideSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!humanOverride.trim() || !activeSessionId) return;

        await createEvent(activeSessionId, 'override', humanOverride, undefined, { priority: 'high' });
        setHumanOverride("");

        // Simulate agents reacting to override
        setTimeout(() => {
            createEvent(activeSessionId, 'system', `Directive accepted. Re-evaluating positions...`, undefined);
        }, 1000);
    };

    const currentDisplayTime = playbackTime || Date.now();

    // Calculate consensus score and active agents for the visualization
    const roundNumber = events.filter(e => e.type === 'system' && e.content.toLowerCase().includes('round')).length || 1;
    const activeAgents = new Set(events.filter(e => e.type !== 'system' && e.type !== 'override').map(e => e.agentId)).size || 0;
    const consensusScore = activeSession?.consensus_score || 0;

    if (!activeSession) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground flex-col gap-4">
                <AlertTriangle className="w-8 h-8 opacity-50" />
                <p>No active War Room sessions.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full gap-4 overflow-hidden war-room-atmosphere">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0 relative z-10">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                        <Map className="w-5 h-5 text-amber-500" />
                        The War Room
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <span className="font-mono bg-accent/50 px-1.5 py-0.5 rounded text-foreground/70">{activeSession.topic}</span>
                        {activeSession.status === 'active' ? (
                            <span className="flex items-center gap-1 text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live</span>
                        ) : (
                            <span className="flex items-center gap-1 text-muted-foreground"><CheckCircle2 className="w-3 h-3" /> Resolved</span>
                        )}
                    </p>
                </div>

                {/* Session Switcher & Consensus Score */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Session</span>
                        <select
                            className="h-9 text-xs bg-accent/30 border border-border rounded-lg px-3 outline-none focus:ring-1 focus:ring-amber-500/50"
                            value={activeSessionId || ''}
                            onChange={e => setActiveSession(e.target.value)}
                        >
                            {sessions.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.topic.slice(0, 30)}... ({s.status})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="h-10 w-px bg-border hidden sm:block"></div>

                    <div className="flex items-center gap-3 hidden sm:flex">
                        <div className="flex flex-col text-right">
                            <span className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase">Global Consensus</span>
                            <span className="text-xs font-medium text-foreground">{activeAgents} Agents Engaging</span>
                        </div>
                        <ConsensusScore
                            score={consensusScore}
                            agentCount={activeAgents}
                            round={roundNumber}
                            size="md"
                        />
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="flex-1 min-h-0 grid grid-cols-12 gap-4 relative z-10">

                {/* Left Column: Visualization */}
                <div className="col-span-8 flex flex-col gap-4 min-h-0">
                    <div className="flex-1 relative rounded-xl overflow-hidden nerv-glass-2 shadow-inner">
                        {/* Round Scan Line */}
                        <motion.div
                            key={roundNumber}
                            className="absolute top-1/2 left-0 w-full h-[2px] z-50 pointer-events-none"
                            style={{ background: 'linear-gradient(90deg, transparent, var(--accent-violet), transparent)' }}
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ duration: 1.2, ease: "easeInOut" }}
                        />

                        <DebateGraph events={events} currentTime={currentDisplayTime} />

                        {/* Heatmap Overlay */}
                        <div className="absolute top-4 right-4 w-48 nerv-glass-1 p-3 rounded-xl shadow-xl">
                            <ConsensusHeatmap events={events} currentTime={currentDisplayTime} />
                        </div>
                    </div>

                    {/* Timeline and Scrubber */}
                    <div className="shrink-0 flex items-center gap-2 relative">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 shrink-0 rounded-xl bg-card border-border/50 text-foreground"
                            onClick={() => setIsPlaying(!isPlaying)}
                        >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>

                        <div className="flex-1">
                            <TimelineScrubber
                                events={events}
                                currentTime={currentDisplayTime}
                                onTimeChange={(t) => {
                                    setPlaybackTime(t);
                                    setIsPlaying(false); // pause if scrubbing manually
                                }}
                            />
                        </div>

                        {playbackTime && events.length > 0 && playbackTime < events[events.length - 1].timestamp && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-accent hover:bg-amber-500/20 hover:text-amber-400"
                                onClick={() => { setPlaybackTime(events[events.length - 1].timestamp); setIsPlaying(false); }}
                                title="Jump to present"
                            >
                                <FastForward className="w-3 h-3" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Right Column: Reasoning & Override */}
                <div className="col-span-4 flex flex-col gap-4 min-h-0">
                    <div className="flex-1 min-h-0">
                        <h3 className="text-xs font-semibold text-foreground/80 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                            <History className="w-3.5 h-3.5" /> Agent Stances
                        </h3>
                        <ReasoningPanel events={events} currentTime={currentDisplayTime} />
                    </div>

                    {/* Human Override */}
                    {activeSession.status === 'active' && (
                        <div className="shrink-0 mt-auto pt-2">
                            <form onSubmit={handleOverrideSubmit} className="relative group">
                                <Input
                                    value={humanOverride}
                                    onChange={(e) => setHumanOverride(e.target.value)}
                                    placeholder="Inject human directive..."
                                    className="pr-10 bg-accent/20 border-border/60 focus-visible:ring-amber-500/30 rounded-xl h-11 text-sm transition-all shadow-sm"
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    className="absolute right-1.5 top-1.5 h-8 w-8 bg-amber-500 hover:bg-amber-600 text-black rounded-lg transition-transform group-focus-within:scale-105"
                                    disabled={!humanOverride.trim()}
                                >
                                    <Send className="w-3.5 h-3.5 ml-0.5" />
                                </Button>
                            </form>
                            <p className="text-[9px] text-muted-foreground mt-1.5 px-1 text-center font-medium">Override prompts bypass standard deliberation and force agent realignment.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
