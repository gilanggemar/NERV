'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Cpu, Zap, Globe, Clock, Thermometer, BarChart3, Coins, Hash, Sparkles, Server, ChevronRight } from 'lucide-react';
import { useCapabilitiesStore } from '@/store/useCapabilitiesStore';
import { useAgentStore } from '@/store/useAgentStore';
import { useRouter } from 'next/navigation';
import type { AgentProfile } from '@/lib/agentRoster';

interface AgentStatBlockProps {
    agent: AgentProfile;
    level: number;
}

interface TelemetryData {
    successRate: number;
    avgLatency: number;
    totalOps: number;
    totalTokens: number;
    monthlyCost: number;
}

function StatBar({ value, max, color, agentColor }: { value: number; max: number; color: string; agentColor: string }) {
    const percent = Math.min(100, (value / max) * 100);
    return (
        <div className="w-full h-[3px] bg-white/8 rounded-full overflow-hidden mt-1">
            <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
            />
        </div>
    );
}

function getSuccessColor(rate: number) {
    if (rate >= 90) return '#4ade80';
    if (rate >= 70) return '#fbbf24';
    return '#f87171';
}

function getLatencyColor(ms: number) {
    if (ms <= 200) return '#4ade80';
    if (ms <= 800) return '#fbbf24';
    return '#f87171';
}

function getUplinkColor(pct: number) {
    if (pct >= 99) return '#4ade80';
    if (pct >= 95) return '#fbbf24';
    return '#f87171';
}

function formatTokens(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
}

export function AgentStatBlock({ agent, level }: AgentStatBlockProps) {
    const router = useRouter();
    const {
        mcps, skills, assignments, fetchMcps, fetchSkills, fetchAssignmentsForAgent,
        getToolCountForAgent, getMcpCountForAgent, getSkillCountForAgent,
        getAssignedMcpsForAgent, getAssignedSkillsForAgent,
    } = useCapabilitiesStore();
    const storeAgent = useAgentStore((s) => s.agents[agent.id]);
    const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
    const [showAllTools, setShowAllTools] = useState(false);
    const [showAllSkills, setShowAllSkills] = useState(false);

    // Get model from store, fallback to "Not configured"
    const modelName = storeAgent?.model || 'Not configured';

    // Fetch capabilities on mount
    useEffect(() => {
        if (mcps.length === 0) fetchMcps();
        if (skills.length === 0) fetchSkills();
    }, [mcps.length, skills.length, fetchMcps, fetchSkills]);

    // Fetch assignments for this agent
    useEffect(() => {
        fetchAssignmentsForAgent(agent.id);
    }, [agent.id, fetchAssignmentsForAgent]);

    // Fetch telemetry for this agent
    useEffect(() => {
        fetch(`/api/telemetry?agentId=${agent.id}`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data) {
                    setTelemetry({
                        successRate: data.successRate ?? 0,
                        avgLatency: data.avgLatency ?? 0,
                        totalOps: data.totalOps ?? 0,
                        totalTokens: data.totalTokens ?? 0,
                        monthlyCost: data.monthlyCost ?? 0,
                    });
                }
            })
            .catch(() => {
                // Fallback to zeros when no data
                setTelemetry({
                    successRate: 0,
                    avgLatency: 0,
                    totalOps: 0,
                    totalTokens: 0,
                    monthlyCost: 0,
                });
            });
    }, [agent.id]);

    // Capabilities assigned to this agent (memoized to prevent infinite re-renders)
    const totalTools = useMemo(() => getToolCountForAgent(agent.id), [agent.id, assignments, mcps]);
    const mcpCount = useMemo(() => getMcpCountForAgent(agent.id), [agent.id, assignments]);
    const skillCount = useMemo(() => getSkillCountForAgent(agent.id), [agent.id, assignments]);
    const assignedMcps = useMemo(() => getAssignedMcpsForAgent(agent.id), [agent.id, assignments, mcps]);
    const assignedSkills = useMemo(() => getAssignedSkillsForAgent(agent.id), [agent.id, assignments, skills]);

    const mcpNames = assignedMcps.map(m => m.name);
    const displayMcps = showAllTools ? mcpNames : mcpNames.slice(0, 3);
    const mcpExtraCount = mcpNames.length - 3;

    const skillNames = assignedSkills.map(s => s.name);
    const displaySkills = showAllSkills ? skillNames : skillNames.slice(0, 3);
    const skillExtraCount = skillNames.length - 3;

    const stats = telemetry || { successRate: 0, avgLatency: 0, totalOps: 0, totalTokens: 0, monthlyCost: 0 };

    // Temperature display
    const tempValue = 0.7;
    const tempLabel = tempValue <= 0.3 ? 'precise' : tempValue <= 0.7 ? 'balanced' : 'creative';

    return (
        <div className="flex flex-col h-full overflow-y-auto identity-scrollbar p-5 space-y-5">
            {/* Section Header */}
            <div className="text-[11px] uppercase tracking-[0.2em] font-mono text-white/50">
                Agent Capabilities
            </div>

            {/* Model Badge */}
            <div className="space-y-1.5">
                <div className="text-[11px] uppercase tracking-[0.15em] font-mono text-white/40">Model</div>
                <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-mono"
                    style={{
                        background: `${agent.colorHex}15`,
                        border: `1px solid ${agent.colorHex}40`,
                    }}
                >
                    <Cpu size={14} style={{ color: agent.colorHex }} />
                    <span className="text-white/90">{modelName}</span>
                </div>
            </div>

            {/* Capabilities Section */}
            <div className="space-y-3">
                <button
                    onClick={() => router.push('/dashboard/capabilities')}
                    className="flex items-center gap-1 text-[11px] uppercase tracking-[0.15em] font-mono text-white/40 hover:text-white/60 transition-colors pointer-events-auto"
                >
                    Capabilities <ChevronRight size={10} />
                </button>

                {/* MCP Tools */}
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <Server size={12} className="text-white/40" />
                        <span className="text-[11px] uppercase tracking-[0.12em] font-mono text-white/40">MCP Tools</span>
                    </div>
                    <button
                        onClick={() => router.push('/dashboard/capabilities')}
                        className="text-sm font-mono text-white/70 hover:text-white/90 transition-colors pointer-events-auto"
                    >
                        {totalTools} tools from {mcpCount} servers
                    </button>
                    {mcpNames.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {displayMcps.map(name => (
                                <span
                                    key={name}
                                    className="px-2 py-0.5 rounded-full text-[10px] font-mono text-white/60 border border-white/10 bg-white/5"
                                    style={{ borderColor: `${agent.colorHex}30` }}
                                >
                                    {name}
                                </span>
                            ))}
                            {!showAllTools && mcpExtraCount > 0 && (
                                <button
                                    onClick={() => setShowAllTools(true)}
                                    className="px-2 py-0.5 rounded-full text-[10px] font-mono text-blue-400/80 border border-blue-400/20 bg-blue-400/5 cursor-pointer hover:bg-blue-400/10 transition-colors pointer-events-auto"
                                >
                                    +{mcpExtraCount} more
                                </button>
                            )}
                            {showAllTools && mcpExtraCount > 0 && (
                                <button
                                    onClick={() => setShowAllTools(false)}
                                    className="px-2 py-0.5 rounded-full text-[10px] font-mono text-white/40 cursor-pointer pointer-events-auto"
                                >
                                    <ChevronUp size={10} />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Skills */}
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <Sparkles size={12} className="text-violet-400/60" />
                        <span className="text-[11px] uppercase tracking-[0.12em] font-mono text-white/40">Skills</span>
                    </div>
                    <button
                        onClick={() => router.push('/dashboard/capabilities')}
                        className="text-sm font-mono text-white/70 hover:text-white/90 transition-colors pointer-events-auto"
                    >
                        {skillCount} skills assigned
                    </button>
                    {skillNames.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {displaySkills.map(name => (
                                <span
                                    key={name}
                                    className="px-2 py-0.5 rounded-full text-[10px] font-mono text-violet-400/70 border border-violet-400/20 bg-violet-400/5"
                                >
                                    {name}
                                </span>
                            ))}
                            {!showAllSkills && skillExtraCount > 0 && (
                                <button
                                    onClick={() => setShowAllSkills(true)}
                                    className="px-2 py-0.5 rounded-full text-[10px] font-mono text-violet-400/80 border border-violet-400/20 bg-violet-400/5 cursor-pointer hover:bg-violet-400/10 transition-colors pointer-events-auto"
                                >
                                    +{skillExtraCount} more
                                </button>
                            )}
                            {showAllSkills && skillExtraCount > 0 && (
                                <button
                                    onClick={() => setShowAllSkills(false)}
                                    className="px-2 py-0.5 rounded-full text-[10px] font-mono text-white/40 cursor-pointer pointer-events-auto"
                                >
                                    <ChevronUp size={10} />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Performance Divider */}
            <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-white/30">Performance</span>
                <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Success Rate */}
            <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                    <span className="text-[11px] uppercase tracking-[0.15em] font-mono text-white/40">Success Rate</span>
                    <span className="text-lg font-mono tabular-nums text-white/90">{stats.successRate.toFixed(1)}%</span>
                </div>
                <StatBar value={stats.successRate} max={100} color={getSuccessColor(stats.successRate)} agentColor={agent.colorHex} />
            </div>

            {/* Avg Latency */}
            <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                    <span className="text-[11px] uppercase tracking-[0.15em] font-mono text-white/40">Avg Latency</span>
                    <span className="text-lg font-mono tabular-nums text-white/90">{stats.avgLatency}ms</span>
                </div>
                <StatBar value={Math.max(0, 1000 - stats.avgLatency)} max={1000} color={getLatencyColor(stats.avgLatency)} agentColor={agent.colorHex} />
            </div>

            {/* Uplink */}
            <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                    <span className="text-[11px] uppercase tracking-[0.15em] font-mono text-white/40">Uplink</span>
                    <span className="text-lg font-mono tabular-nums text-white/90">99.9%</span>
                </div>
                <StatBar value={99.9} max={100} color={getUplinkColor(99.9)} agentColor={agent.colorHex} />
            </div>

            {/* Context Window */}
            <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                    <span className="text-[11px] uppercase tracking-[0.15em] font-mono text-white/40">Context Window</span>
                    <span className="text-lg font-mono tabular-nums text-white/90">200K tokens</span>
                </div>
            </div>

            {/* Temperature */}
            <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                    <span className="text-[11px] uppercase tracking-[0.15em] font-mono text-white/40">Temperature</span>
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-mono tabular-nums text-white/90">{tempValue}</span>
                        <span className="text-[10px] font-mono text-white/40">[{tempLabel}]</span>
                    </div>
                </div>
                <StatBar value={tempValue} max={1} color={agent.colorHex} agentColor={agent.colorHex} />
            </div>

            {/* Totals Divider */}
            <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-white/30">Totals</span>
                <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Total Ops */}
            <div className="flex justify-between items-baseline">
                <span className="text-[11px] uppercase tracking-[0.15em] font-mono text-white/40">Total Ops</span>
                <span className="text-lg font-mono tabular-nums text-white/90">{stats.totalOps.toLocaleString()}</span>
            </div>

            {/* Tokens Used */}
            <div className="flex justify-between items-baseline">
                <span className="text-[11px] uppercase tracking-[0.15em] font-mono text-white/40">Tokens Used</span>
                <span className="text-lg font-mono tabular-nums text-white/90">{formatTokens(stats.totalTokens)}</span>
            </div>

            {/* Monthly Cost */}
            <div className="flex justify-between items-baseline">
                <span className="text-[11px] uppercase tracking-[0.15em] font-mono text-white/40">Cost (Month)</span>
                <span className="text-lg font-mono tabular-nums text-white/90">${stats.monthlyCost.toFixed(2)}</span>
            </div>
        </div>
    );
}
