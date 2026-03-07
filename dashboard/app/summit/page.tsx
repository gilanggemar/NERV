"use client";

import { useSocket, useSocketStore, SummitMessage } from "@/lib/useSocket";
import { useTaskStore } from "@/lib/useTaskStore";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
    Send, Bot, User, BrainCircuit, Loader2,
    Users, Check, X, RotateCcw, Zap, Play, Pause,
    MessageSquare, ChevronRight, FileText, Rocket, RefreshCw, Target, Puzzle, AlertTriangle
} from "lucide-react";
import {
    IconPlus, IconPaperclip, IconWand, IconSend
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ToolNodeCard } from "@/components/ToolNodeCard";
import { MessageRenderer } from "@/components/chat/MessageRenderer";
import { AgentAvatar } from "@/components/agents/AgentAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* ── Color palette for agent differentiation ── */
const AGENT_COLORS: Record<string, { border: string; bg: string; text: string; glow: string }> = {};
const COLOR_PALETTE = [
    { border: "border-blue-500/40", bg: "bg-blue-500/5", text: "text-blue-400", glow: "" },
    { border: "border-violet-500/40", bg: "bg-violet-500/5", text: "text-violet-400", glow: "" },
    { border: "border-amber-500/40", bg: "bg-amber-500/5", text: "text-amber-400", glow: "" },
    { border: "border-emerald-500/40", bg: "bg-emerald-500/5", text: "text-emerald-400", glow: "" },
    { border: "border-rose-500/40", bg: "bg-rose-500/5", text: "text-rose-400", glow: "" },
    { border: "border-cyan-500/40", bg: "bg-cyan-500/5", text: "text-cyan-400", glow: "" },
];

function getAgentColor(agentId: string, index: number) {
    if (!AGENT_COLORS[agentId]) {
        AGENT_COLORS[agentId] = COLOR_PALETTE[index % COLOR_PALETTE.length];
    }
    return AGENT_COLORS[agentId];
}

function agentDisplayName(agent: any): string {
    if (agent?.accountId && agent?.channel === 'slack') {
        return agent.accountId.charAt(0).toUpperCase() + agent.accountId.slice(1);
    }
    return agent?.name ?? agent?.id ?? 'Agent';
}

function rpcAgentId(agent: any): string {
    if (agent.channel === 'slack' && agent.accountId) {
        return agent.accountId;
    }
    return agent.id;
}

const stripTrailingTags = (content: string) => {
    let clean = content.replace(/<\/?(?:final|function|tool|call|response)[^>]*>?\s*$/i, '');
    return clean.replace(/<\/[a-zA-Z]*>?\s*$/i, '');
};

const renderSummitMessageContent = (content: string) => {
    if (!content) return null;

    const cleanContent = stripTrailingTags(content);

    const regex = new RegExp('([\\u{100085}<])?(call|response):([a-zA-Z0-9_]+)(\\{[\\s\\S]*?\\})([\\u{100086}>])?', 'gu');
    const parts: any[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(cleanContent)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ type: 'text', content: cleanContent.slice(lastIndex, match.index) });
        }
        parts.push({
            type: match[2],
            name: match[3],
            args: match[4]
        });
        lastIndex = regex.lastIndex;
    }

    if (lastIndex < cleanContent.length) {
        parts.push({ type: 'text', content: cleanContent.slice(lastIndex) });
    }

    return (
        <>
            {parts.map((part, idx) => {
                if (part.type === 'call') {
                    let out = undefined;
                    let isCompleted = false;
                    for (let j = idx + 1; j < parts.length; j++) {
                        if (parts[j].type === 'response' && parts[j].name === part.name) {
                            out = parts[j].args;
                            isCompleted = true;
                            parts[j].type = 'consumed_response';
                            break;
                        }
                    }

                    return (
                        <div key={idx} className="mt-3 mb-3 w-full pl-1">
                            <ToolNodeCard tc={{
                                id: `call-${idx}`,
                                status: isCompleted ? 'completed' : 'in_progress',
                                function: { name: part.name || 'unknown_tool', arguments: part.args || '' },
                                output: out
                            }} />
                        </div>
                    );
                } else if (part.type === 'response') {
                    return (
                        <div key={idx} className="mt-3 mb-3 w-full pl-1">
                            <ToolNodeCard tc={{
                                id: `resp-${idx}`,
                                status: 'completed',
                                function: { name: `${part.name} (Output)`, arguments: '{}' },
                                output: part.args
                            }} />
                        </div>
                    );
                } else if (part.type === 'consumed_response') {
                    return null;
                }
                return <div key={idx} className="w-full"><MessageRenderer content={part.content} /></div>;
            })}
        </>
    );
};

/* ── Context constants ── */
const RECENT_MSG_COUNT = 3;

export default function SummitPage() {
    const { agents, isConnected, summitMessages, summitParticipants, summitActive, summitRound } = useSocketStore();
    const {
        addSummitMessage, setSummitParticipants, setSummitActive,
        incrementSummitRound, clearSummit
    } = useSocketStore();
    const { sendSummitMessage } = useSocket();
    const { addTask } = useTaskStore();
    const router = useRouter();

    const [message, setMessage] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [autoDeliberate, setAutoDeliberate] = useState(false);
    const [maxRounds, setMaxRounds] = useState(10);
    const [summitTopic, setSummitTopic] = useState("");
    const [showPhase2, setShowPhase2] = useState(false);
    const [deliberationRound, setDeliberationRound] = useState(0);
    const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
    const [speakerQueue, setSpeakerQueue] = useState<string[]>([]);
    const [refinementContext, setRefinementContext] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const autoDelibTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const speakerStreamStartedRef = useRef(false);
    const speakerQueueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const speakerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const SPEAKER_TIMEOUT_MS = 45_000;

    const roundInFlight = currentSpeaker !== null || speakerQueue.length > 0;

    const onlineAgents = useMemo(() => agents.filter(a => a.status !== 'offline'), [agents]);

    useEffect(() => {
        const escalatedTopic = sessionStorage.getItem('nerv_escalation_topic');
        if (escalatedTopic) {
            setSummitTopic(escalatedTopic);
            sessionStorage.removeItem('nerv_escalation_topic');
        }
    }, []);

    useEffect(() => {
        if (onlineAgents.length > 0 && selectedIds.size === 0 && !summitActive) {
            setSelectedIds(new Set(onlineAgents.map(a => a.id)));
        }
    }, [onlineAgents, selectedIds.size, summitActive]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [summitMessages]);

    useEffect(() => {
        if (!summitActive) return;

        const warningMsg = 'The Summit is in progress. Leaving now will stop the deliberation and any unsaved results will be lost. Are you sure you want to leave?';

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = warningMsg;
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        const originalPushState = history.pushState.bind(history);
        const originalReplaceState = history.replaceState.bind(history);

        history.pushState = function (...args: Parameters<typeof history.pushState>) {
            if (window.confirm(warningMsg)) {
                return originalPushState(...args);
            }
        };
        history.replaceState = function (...args: Parameters<typeof history.replaceState>) {
            if (window.confirm(warningMsg)) {
                return originalReplaceState(...args);
            }
        };

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            history.pushState = originalPushState;
            history.replaceState = originalReplaceState;
        };
    }, [summitActive]);

    const toggleAgent = useCallback((id: string) => {
        if (summitActive) return;
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, [summitActive]);

    const startSession = useCallback(() => {
        if (selectedIds.size < 2) return;
        clearSummit();
        const participantRpcIds = onlineAgents
            .filter(a => selectedIds.has(a.id))
            .map(a => rpcAgentId(a));
        setSummitParticipants(participantRpcIds);
        setSummitActive(true);
    }, [selectedIds, onlineAgents, clearSummit, setSummitParticipants, setSummitActive]);

    const endSession = useCallback(() => {
        setSummitActive(false);
        setAutoDeliberate(false);
        if (autoDelibTimerRef.current) clearTimeout(autoDelibTimerRef.current);
    }, [setSummitActive]);

    const findAgent = useCallback((rpcId: string) => {
        return onlineAgents.find(a => rpcAgentId(a) === rpcId);
    }, [onlineAgents]);

    const buildContextMessage = useCallback((newUserText?: string, forAgent?: string): string => {
        const getName = (rpcId: string): string => {
            const a = findAgent(rpcId);
            return a ? agentDisplayName(a) : rpcId;
        };

        const currentAgentName = forAgent ? getName(forAgent) : 'Agent';
        const participantNames = summitParticipants.map(getName).join(', ');
        const hasTopic = summitTopic.trim().length > 0;
        const isDeliberation = !newUserText;
        const topicStr = hasTopic ? summitTopic.trim() : 'Open discussion';

        const completed = summitMessages.filter(m => !m.streaming && m.agentId !== 'system');
        const splitAt = Math.max(0, completed.length - RECENT_MSG_COUNT);
        const olderMessages = completed.slice(0, splitAt);
        const recentMessages = completed.slice(splitAt);

        let summaryBlock = '';
        if (olderMessages.length > 0) {
            const lines = olderMessages.map(m => {
                const name = m.role === 'user' ? 'Operator' : getName(m.agentId);
                const cleanMsg = stripTrailingTags(m.content);
                const firstSentence = cleanMsg.split(/(?<=[.!?])\s/)[0] ?? cleanMsg;
                return `${name}: ${firstSentence}`;
            });
            summaryBlock = `\n<PREVIOUS_ROUNDS_SUMMARY>\n${lines.join('\n')}\n</PREVIOUS_ROUNDS_SUMMARY>`;
        }

        let recentBlock = '';
        if (recentMessages.length > 0) {
            const lines = recentMessages.map(m => {
                const name = m.role === 'user' ? 'Operator' : getName(m.agentId);
                return `[${name}]: ${stripTrailingTags(m.content)}`;
            });
            recentBlock = `\n<RECENT_LOG>\n${lines.join('\n')}\n</RECENT_LOG>`;
        }

        const roleDesc = hasTopic && isDeliberation
            ? `You are ${currentAgentName}. Multi-agent deliberation with ${participantNames}. Operator is observing only — do NOT address the Operator.`
            : `You are ${currentAgentName}. Group chat with ${participantNames} and the Operator (human).`;

        const driftRule = hasTopic && isDeliberation
            ? `RULE 3 (DRIFT PREVENTION): Strictly discuss direct implications of the TOPIC ANCHOR. Do NOT introduce absent agents, hypothetical scenarios, or unrelated tangents. If the previous speaker drifted, forcefully pivot back.`
            : `RULE 3 (NATURAL FLOW): Respond naturally. You may agree, disagree, or build on ideas.`;

        const systemDirective = [
            `<SYSTEM_DIRECTIVE>`,
            `ROLE: ${roleDesc}`,
            `RULE 1 (STRICT CONCISENESS): Respond in 1-3 short sentences. No fluff.`,
            `RULE 2 (TOPIC ANCHOR): The current immutable topic is: "${topicStr}"`,
            driftRule,
            refinementContext ? `RULE 4 (REFINEMENT CONTEXT): The <PRIOR_AGREEMENT> block contains a concatenated transcript of all previous statements. Read it silently to understand the full context of the debate so far.` : '',
            `</SYSTEM_DIRECTIVE>`,
        ].filter(Boolean).join('\n');

        let refinementBlock = '';
        if (refinementContext) {
            refinementBlock = `\n<PRIOR_AGREEMENT>\n${refinementContext}\n</PRIOR_AGREEMENT>`;
        }

        const lastNonSelf = [...recentMessages].reverse().find(m => m.agentId !== forAgent);
        const lastSpeakerName = lastNonSelf
            ? (lastNonSelf.role === 'user' ? 'Operator' : getName(lastNonSelf.agentId))
            : null;

        let turnAction: string;
        if (newUserText) {
            turnAction = `The Operator just said: "${newUserText}"\nAction: Respond to the Operator, adhering to the SYSTEM_DIRECTIVE.`;
        } else if (refinementContext) {
            turnAction = `Action: Review the <PRIOR_AGREEMENT>. If there are unresolved conflicts, continue the debate to reach a unified agreement. If an agreement has already been made, briefly confirm the consensus and outline the final stance. IMPORTANT: You must adhere strictly to RULE 1 (1-3 short sentences). DO NOT output a long summary paragraph.`;
        } else if (lastSpeakerName) {
            turnAction = `Action: Reply to ${lastSpeakerName}, adhering strictly to the SYSTEM_DIRECTIVE.`;
        } else {
            turnAction = `Action: Open the discussion on the topic, adhering to the SYSTEM_DIRECTIVE.`;
        }

        const yourTurn = `\n<YOUR_TURN>\nAgent: ${currentAgentName}\n${turnAction}\nResponse:\n</YOUR_TURN>`;

        return `${systemDirective}${refinementBlock}${summaryBlock}${recentBlock}${yourTurn}`;
    }, [summitMessages, summitParticipants, deliberationRound, summitTopic, refinementContext, findAgent]);

    const startSequentialRound = useCallback((agents: string[], userText?: string) => {
        if (agents.length === 0) return;
        const [first, ...rest] = agents;
        setCurrentSpeaker(first);
        setSpeakerQueue(rest);
        speakerStreamStartedRef.current = false;
        sendSummitMessage([first], buildContextMessage(userText, first));
    }, [sendSummitMessage, buildContextMessage]);

    const handleSend = useCallback((e?: React.FormEvent) => {
        e?.preventDefault();
        if (!message.trim() || !summitActive || !isConnected || summitParticipants.length === 0) return;
        if (roundInFlight) return;

        const userText = message.trim();

        addSummitMessage({
            id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            role: 'user',
            content: userText,
            timestamp: new Date().toLocaleTimeString(),
            agentId: 'operator',
            roundNumber: summitRound + 1,
        });

        incrementSummitRound();
        startSequentialRound(summitParticipants, userText);
        setMessage("");
    }, [message, summitActive, isConnected, summitParticipants, summitRound, roundInFlight, addSummitMessage, incrementSummitRound, startSequentialRound]);

    const handleContinue = useCallback(() => {
        if (!summitActive || !isConnected || summitParticipants.length === 0) return;
        if (deliberationRound >= maxRounds) return;
        if (roundInFlight) return;

        const nextDelib = deliberationRound + 1;

        addSummitMessage({
            id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            role: 'user',
            content: `▸ Deliberation — Round ${nextDelib}`,
            timestamp: new Date().toLocaleTimeString(),
            agentId: 'system',
            roundNumber: nextDelib,
        });

        setDeliberationRound(nextDelib);
        startSequentialRound(summitParticipants);
    }, [summitActive, isConnected, summitParticipants, deliberationRound, maxRounds, roundInFlight, addSummitMessage, startSequentialRound]);

    const streamingCount = useMemo(() => summitMessages.filter(m => m.streaming).length, [summitMessages]);
    const assistantMsgCount = useMemo(() => summitMessages.filter(m => m.role === 'assistant').length, [summitMessages]);

    const advanceQueue = useCallback(() => {
        if (speakerTimeoutRef.current) { clearTimeout(speakerTimeoutRef.current); speakerTimeoutRef.current = null; }
        speakerStreamStartedRef.current = false;

        if (speakerQueue.length > 0) {
            const [next, ...rest] = speakerQueue;
            if (speakerQueueTimerRef.current) clearTimeout(speakerQueueTimerRef.current);
            speakerQueueTimerRef.current = setTimeout(() => {
                setCurrentSpeaker(next);
                setSpeakerQueue(rest);
                speakerStreamStartedRef.current = false;
                sendSummitMessage([next], buildContextMessage(undefined, next));
            }, 600);
        } else {
            setCurrentSpeaker(null);
        }
    }, [speakerQueue, sendSummitMessage, buildContextMessage]);

    useEffect(() => {
        if (!currentSpeaker) return;

        const speakerStreaming = summitMessages.some(
            m => m.agentId === currentSpeaker && m.streaming
        );

        if (speakerStreaming) {
            speakerStreamStartedRef.current = true;

            if (!speakerTimeoutRef.current) {
                speakerTimeoutRef.current = setTimeout(() => {
                    console.warn(`[Summit] Speaker ${currentSpeaker} timed out after ${SPEAKER_TIMEOUT_MS / 1000}s — force-advancing queue`);
                    const stuckMsg = summitMessages.find(m => m.agentId === currentSpeaker && m.streaming);
                    if (stuckMsg) {
                        addSummitMessage({ ...stuckMsg, streaming: false, content: stuckMsg.content + '\n[response timed out]' });
                    }
                    advanceQueue();
                }, SPEAKER_TIMEOUT_MS);
            }
        }

        if (speakerStreamStartedRef.current && !speakerStreaming) {
            advanceQueue();
        }
    }, [summitMessages, currentSpeaker, advanceQueue, addSummitMessage]);

    useEffect(() => {
        return () => {
            if (speakerQueueTimerRef.current) clearTimeout(speakerQueueTimerRef.current);
            if (speakerTimeoutRef.current) clearTimeout(speakerTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        if (autoDelibTimerRef.current) {
            clearTimeout(autoDelibTimerRef.current);
            autoDelibTimerRef.current = null;
        }

        if (autoDeliberate && !roundInFlight && streamingCount === 0 && assistantMsgCount > 0 && deliberationRound < maxRounds && summitActive) {
            autoDelibTimerRef.current = setTimeout(() => {
                handleContinue();
            }, 2500);
        }

        return () => {
            if (autoDelibTimerRef.current) clearTimeout(autoDelibTimerRef.current);
        };
    }, [autoDeliberate, roundInFlight, streamingCount, assistantMsgCount, deliberationRound, maxRounds, summitActive, handleContinue]);

    const agentColorMap = useMemo(() => {
        const map: Record<string, ReturnType<typeof getAgentColor>> = {};
        onlineAgents.forEach((a, i) => {
            map[rpcAgentId(a)] = getAgentColor(rpcAgentId(a), i);
        });
        return map;
    }, [onlineAgents]);

    const agentMsgCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        summitMessages.filter(m => m.role === 'assistant').forEach(m => {
            counts[m.agentId] = (counts[m.agentId] || 0) + 1;
        });
        return counts;
    }, [summitMessages]);

    const isAnyStreaming = streamingCount > 0;

    return (
        <div className="flex h-full gap-0 overflow-hidden flex-row">
            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header Toolbar */}
                <div className="flex-shrink-0">
                    <div className="flex items-center justify-between px-0 pb-3">
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-semibold tracking-tight text-foreground">The Summit</h1>
                            <p className="text-xs text-muted-foreground">
                                {summitActive
                                    ? `Active · Round ${summitRound} · Deliberation ${deliberationRound}/${maxRounds} · ${summitParticipants.length} participants`
                                    : "Multi-agent deliberation"}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            {!summitActive ? (
                                <Button
                                    onClick={startSession}
                                    disabled={selectedIds.size < 2 || !isConnected}
                                    size="sm"
                                    className={cn(
                                        "rounded-full text-xs h-8 px-4 gap-2",
                                        selectedIds.size >= 2 && isConnected
                                            ? "bg-foreground text-background hover:bg-foreground/90"
                                            : "bg-accent text-muted-foreground cursor-not-allowed"
                                    )}
                                >
                                    <Zap className="w-3 h-3" />
                                    Start Session
                                </Button>
                            ) : (
                                <Button
                                    onClick={endSession}
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full text-xs h-8 px-4 gap-2"
                                >
                                    <X className="w-3 h-3" />
                                    End Session
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Agent Selector (only visible before session starts) */}
                    {!summitActive && (
                        <div className="px-6 pb-0 pt-3 flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-muted-foreground mr-1">Participants:</span>
                            {onlineAgents.map((agent, i) => {
                                const color = getAgentColor(rpcAgentId(agent), i);
                                const isSelected = selectedIds.has(agent.id);
                                return (
                                    <button
                                        key={agent.id}
                                        onClick={() => toggleAgent(agent.id)}
                                        className={cn(
                                            "px-4 py-1.5 rounded-full text-xs transition-all flex items-center gap-2 border",
                                            isSelected
                                                ? `${color.bg} ${color.text} ${color.border}`
                                                : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"
                                        )}
                                    >
                                        {isSelected && <Check className="w-2.5 h-2.5" />}
                                        {agentDisplayName(agent)}
                                    </button>
                                );
                            })}
                            {onlineAgents.length === 0 && (
                                <span className="text-xs text-muted-foreground italic">No agents online</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Messages Area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                    {!summitActive && summitMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4 opacity-50">
                            <Users className="w-16 h-16" />
                            <p className="text-sm font-medium">Select agents & start a session</p>
                            <p className="text-xs text-muted-foreground max-w-md text-center">
                                Choose at least 2 agents, then start a session. Your messages will be
                                broadcast to all participants simultaneously.
                            </p>
                        </div>
                    ) : summitActive && summitMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4 opacity-70">
                            <BrainCircuit className="w-12 h-12 animate-pulse text-foreground/30" />
                            <p className="text-sm text-foreground/50">Session active — awaiting input</p>
                            <Button
                                onClick={handleContinue}
                                variant="outline"
                                className="mt-4 rounded-full text-xs"
                            >
                                <Zap className="w-3.5 h-3.5" />
                                Start Deliberation
                            </Button>
                        </div>
                    ) : (
                        summitMessages.map((msg) => {
                            if (msg.agentId === 'system') {
                                return (
                                    <div key={msg.id} className="flex items-center gap-3 my-4">
                                        <div className="flex-1 h-px bg-border" />
                                        <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                            <ChevronRight className="w-2.5 h-2.5" />
                                            {msg.content}
                                        </span>
                                        <div className="flex-1 h-px bg-border" />
                                    </div>
                                );
                            }

                            if (msg.role === 'user') {
                                return (
                                    <div key={msg.id} className="flex justify-center my-6">
                                        <div className="max-w-2xl w-full">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center">
                                                    <User className="w-3 h-3 text-background" />
                                                </div>
                                                <span className="text-xs font-medium text-foreground">
                                                    You — Round {msg.roundNumber ?? '?'}
                                                </span>
                                                <span className="text-[11px] text-muted-foreground ml-auto">{msg.timestamp}</span>
                                            </div>
                                            <div className="p-3.5 bg-foreground text-background rounded-2xl text-[13px] leading-relaxed ml-8">
                                                {msg.content}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            const color = agentColorMap[msg.agentId] ?? COLOR_PALETTE[0];
                            const agent = findAgent(msg.agentId);
                            const label = agent ? agentDisplayName(agent) : msg.agentId;

                            return (
                                <div key={msg.id} className="max-w-2xl">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <AgentAvatar agentId={msg.agentId} name={label} size={24} className={color.border} />
                                        <span className={cn("text-xs font-medium", color.text)}>
                                            {label}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground ml-auto">{msg.timestamp}</span>
                                    </div>
                                    <div className="flex flex-col w-full ml-8">
                                        {msg.tool_calls && msg.tool_calls.length > 0 && (
                                            <div className="flex flex-col gap-2 mb-3 w-full">
                                                {msg.tool_calls.map((tc, idx) => {
                                                    let argsDisplay = tc.function?.arguments || JSON.stringify(tc);
                                                    try {
                                                        const parsedArgs = JSON.parse(argsDisplay);
                                                        if (parsedArgs.command) {
                                                            argsDisplay = parsedArgs.command;
                                                        } else if (parsedArgs.code) {
                                                            argsDisplay = parsedArgs.code;
                                                        } else {
                                                            argsDisplay = JSON.stringify(parsedArgs, null, 2);
                                                        }
                                                    } catch (e) { /* ignore */ }

                                                    const status = tc.status || 'completed';
                                                    const isError = status === 'failed';
                                                    const inProgress = status === 'in_progress';

                                                    return (
                                                        <div key={idx} className={cn(
                                                            "bg-accent border rounded-xl p-3 w-full text-sm mt-1",
                                                            isError ? "border-red-500/30" : "border-border"
                                                        )}>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-2 text-foreground text-xs font-medium">
                                                                    {inProgress ? (
                                                                        <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                                                                    ) : (
                                                                        <Puzzle className={cn("w-3.5 h-3.5", isError ? "text-red-400" : "text-muted-foreground")} />
                                                                    )}
                                                                    {tc.function?.name || 'tool_call'}
                                                                </div>
                                                                {inProgress ? (
                                                                    <span className="text-[10px] text-blue-400 font-medium animate-pulse">Running</span>
                                                                ) : isError ? (
                                                                    <AlertTriangle className="w-3.5 h-3.5 text-red-500/80" />
                                                                ) : (
                                                                    <Check className="w-3.5 h-3.5 text-emerald-500/80" />
                                                                )}
                                                            </div>
                                                            <div className="text-muted-foreground text-xs mb-2 break-all whitespace-pre-wrap pl-6">
                                                                {argsDisplay}
                                                            </div>
                                                            {(tc.output || tc.progress) && (
                                                                <div className="mt-2 pl-6">
                                                                    <div className={cn(
                                                                        "text-xs p-2 rounded-lg bg-background border whitespace-pre-wrap break-all",
                                                                        isError ? "text-red-400 border-red-500/20" : "text-muted-foreground border-border"
                                                                    )}>
                                                                        {tc.progress ? `Progress: ${tc.progress}` : tc.output}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        <div className={cn(
                                            "p-3.5 border rounded-2xl text-[13px] leading-relaxed",
                                            color.border, "bg-accent/50 text-foreground"
                                        )}>
                                            {renderSummitMessageContent(msg.content)}
                                            {msg.streaming && (
                                                <Loader2 className="inline-block w-3 h-3 ml-1 text-muted-foreground animate-spin" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {/* Summit Complete card */}
                    {summitActive && deliberationRound >= maxRounds && !isAnyStreaming && !roundInFlight && (
                        <div className="flex justify-center my-8 w-full">
                            <div className="max-w-lg w-full p-5 border border-border bg-accent rounded-2xl text-center space-y-4">
                                <div className="flex items-center justify-center gap-2 text-foreground">
                                    <BrainCircuit className="w-5 h-5" />
                                    <span className="text-sm font-semibold">Summit Complete</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {maxRounds} rounds of deliberation concluded with {summitParticipants.length} participants.
                                </p>
                                <div className="flex items-center justify-center gap-3 pt-2">
                                    <Button onClick={() => setShowPhase2(true)} variant="outline" className="text-xs h-8 rounded-full">
                                        <FileText className="w-3.5 h-3.5 mr-1.5" /> View The Plan
                                    </Button>
                                    <Button onClick={() => router.push('/dashboard/war-room')} className="text-xs h-8 rounded-full bg-amber-500 text-black hover:bg-amber-600">
                                        <Target className="w-3.5 h-3.5 mr-1.5" /> Enter War Room
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area — Blocks.so style */}
                <div className="pt-2 pb-0 w-full">
                    <div className="bg-background border border-border shadow-sm rounded-3xl overflow-hidden focus-within:ring-1 focus-within:ring-border/50 transition-all">
                        <div className="px-3 pt-3 pb-2 grow relative">
                            {(isAnyStreaming || currentSpeaker) && (
                                <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2 animate-pulse">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    {currentSpeaker ? (() => {
                                        const agent = findAgent(currentSpeaker);
                                        const name = agent ? agentDisplayName(agent) : currentSpeaker;
                                        return `${name} is speaking... (${speakerQueue.length} waiting)`;
                                    })() : `${streamingCount} agent${streamingCount > 1 ? 's' : ''} responding...`}
                                </div>
                            )}
                            <form onSubmit={handleSend}>
                                <Textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder={
                                        !isConnected ? "Connection offline"
                                            : !summitActive ? "Start a session first..."
                                                : autoDeliberate ? "🖐️ Interject as stakeholder..."
                                                    : deliberationRound >= maxRounds ? "Summit complete — increase max rounds or type to continue..."
                                                        : "Address the council..."
                                    }
                                    disabled={!isConnected || !summitActive}
                                    className="w-full bg-transparent! p-0 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder-muted-foreground resize-none border-none outline-none text-[13px] min-h-10 max-h-[25vh]"
                                    rows={1}
                                    onInput={(e) => {
                                        const target = e.target as HTMLTextAreaElement;
                                        target.style.height = "auto";
                                        target.style.height = target.scrollHeight + "px";
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend(e);
                                        }
                                    }}
                                />
                            </form>
                        </div>

                        <div className="mb-2 px-2 flex items-center justify-between">
                            <div className="flex items-center gap-1">
                                {/* Continue button */}
                                {summitActive && !isAnyStreaming && !roundInFlight && summitMessages.length > 0 && deliberationRound < maxRounds && (
                                    <Button
                                        type="button"
                                        onClick={handleContinue}
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-3 rounded-full border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 gap-1.5"
                                    >
                                        <Play className="w-3 h-3" />
                                        <span className="text-xs">Continue</span>
                                    </Button>
                                )}
                            </div>

                            <div>
                                <Button
                                    type="submit"
                                    disabled={!message.trim() || !isConnected || !summitActive}
                                    className="size-8 p-0 rounded-full bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleSend}
                                >
                                    <IconSend className="size-3 text-primary-foreground" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel: Participants */}
            <div className="w-64 border-l border-border bg-background flex flex-col flex-shrink-0 ml-3">
                <div className="p-4 border-b border-border">
                    <h3 className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-4">Council Members</h3>

                    {/* Topic of Discussion */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] text-muted-foreground block">Topic</label>
                        <Textarea
                            value={summitTopic}
                            onChange={(e) => setSummitTopic(e.target.value)}
                            placeholder="e.g. Budget allocation for Q3 sprint..."
                            rows={2}
                            className="bg-accent border-border text-foreground text-xs rounded-xl resize-none focus-visible:ring-ring placeholder:text-muted-foreground/50"
                        />
                        {summitTopic.trim() && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Target className="w-2.5 h-2.5" /> Topic active — agents will focus on this
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                    {summitActive ? (
                        summitParticipants.map((rpcId, i) => {
                            const agent = findAgent(rpcId);
                            const color = agentColorMap[rpcId] ?? COLOR_PALETTE[i % COLOR_PALETTE.length];
                            const label = agent ? agentDisplayName(agent) : rpcId;
                            const msgCount = agentMsgCounts[rpcId] ?? 0;
                            const isStreaming = summitMessages.some(m => m.agentId === rpcId && m.streaming);

                            return (
                                <div
                                    key={rpcId}
                                    className={cn(
                                        "p-2.5 border rounded-xl transition-all",
                                        color.border, color.bg
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center border",
                                            color.border, "bg-background"
                                        )}>
                                            <span className={cn("text-[10px] font-semibold", color.text)}>
                                                {label.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className={cn("text-xs font-medium block truncate", color.text)}>
                                                {label}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground">
                                                {isStreaming ? "Responding..." : msgCount > 0 ? `${msgCount} message${msgCount > 1 ? 's' : ''}` : "Standing by"}
                                            </span>
                                        </div>
                                        {isStreaming && (
                                            <Loader2 className={cn("w-3 h-3 animate-spin", color.text)} />
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        onlineAgents.map((agent, i) => {
                            const isSelected = selectedIds.has(agent.id);
                            const color = getAgentColor(rpcAgentId(agent), i);
                            return (
                                <Button
                                    key={agent.id}
                                    onClick={() => toggleAgent(agent.id)}
                                    variant="ghost"
                                    className={cn(
                                        "w-full p-2.5 h-auto border rounded-xl text-left justify-start",
                                        isSelected
                                            ? `${color.border} ${color.bg}`
                                            : "border-border bg-transparent hover:border-foreground/20"
                                    )}
                                >
                                    <div className="flex items-center gap-2 w-full">
                                        <div className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center border shrink-0",
                                            isSelected ? `${color.border} bg-background` : "border-border bg-background"
                                        )}>
                                            {isSelected ? (
                                                <Check className={cn("w-3 h-3", color.text)} />
                                            ) : (
                                                <span className="text-[10px] text-muted-foreground font-semibold">
                                                    {agentDisplayName(agent).charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className={cn(
                                                "text-xs font-medium block truncate",
                                                isSelected ? color.text : "text-muted-foreground"
                                            )}>
                                                {agentDisplayName(agent)}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {agent.status === 'working' ? 'Working' : 'Idle'}
                                            </span>
                                        </div>
                                        <div className={cn(
                                            "w-2 h-2 rounded-full shrink-0",
                                            agent.status === 'working' ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                                        )} />
                                    </div>
                                </Button>
                            );
                        })
                    )}

                    {onlineAgents.length === 0 && (
                        <div className="p-4 text-center text-muted-foreground text-xs italic">
                            No agents detected
                        </div>
                    )}
                </div>

                {/* Session Controls */}
                {summitActive && (
                    <div className="p-3 border-t border-border space-y-2 flex-shrink-0">
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-accent p-2 border border-border rounded-xl text-center">
                                <span className="text-[10px] text-muted-foreground block">Session</span>
                                <span className="text-foreground font-semibold text-sm">{summitRound}</span>
                            </div>
                            <div className="bg-accent p-2 border border-border rounded-xl text-center">
                                <span className="text-[10px] text-muted-foreground block">Delib</span>
                                <span className="text-foreground font-semibold text-sm">{deliberationRound}<span className="text-muted-foreground text-[10px]"> / {maxRounds}</span></span>
                            </div>
                            <div className="bg-accent p-2 border border-border rounded-xl text-center">
                                <span className="text-[10px] text-muted-foreground block">Replies</span>
                                <span className="text-foreground font-semibold text-sm">
                                    {assistantMsgCount}
                                </span>
                            </div>
                        </div>

                        {/* Max Rounds Control */}
                        <div className="flex items-center justify-between bg-accent p-2 border border-border rounded-xl">
                            <span className="text-[10px] text-muted-foreground">Max Rounds</span>
                            <div className="flex items-center gap-1">
                                <Button
                                    onClick={() => setMaxRounds(prev => Math.max(1, prev - 1))}
                                    variant="ghost"
                                    size="icon-xs"
                                    className="w-5 h-5 rounded-full bg-background text-muted-foreground hover:text-foreground"
                                >-</Button>
                                <span className="text-foreground text-xs w-6 text-center">{maxRounds}</span>
                                <Button
                                    onClick={() => setMaxRounds(prev => Math.min(50, prev + 1))}
                                    variant="ghost"
                                    size="icon-xs"
                                    className="w-5 h-5 rounded-full bg-background text-muted-foreground hover:text-foreground"
                                >+</Button>
                            </div>
                        </div>

                        {/* Auto-Deliberate Toggle */}
                        <Button
                            onClick={() => setAutoDeliberate(prev => !prev)}
                            variant="outline"
                            className={cn(
                                "w-full h-auto p-2 rounded-xl text-xs flex items-center justify-center gap-2",
                                autoDeliberate
                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20"
                                    : "bg-transparent text-muted-foreground border-border hover:bg-accent hover:text-foreground"
                            )}
                        >
                            {autoDeliberate ? (
                                <><Pause className="w-3 h-3" /> Auto-Deliberate On</>
                            ) : (
                                <><Play className="w-3 h-3" /> Auto-Deliberate</>
                            )}
                        </Button>

                        {autoDeliberate && (
                            <p className="text-[10px] text-emerald-500/70 text-center">
                                Auto-firing rounds until {maxRounds}
                            </p>
                        )}

                        {/* Reset */}
                        <Button
                            onClick={() => { clearSummit(); setSelectedIds(new Set(onlineAgents.map(a => a.id))); setAutoDeliberate(false); }}
                            variant="outline"
                            className="w-full h-auto p-1.5 rounded-xl text-xs bg-transparent text-muted-foreground border-border hover:bg-accent hover:text-foreground"
                        >
                            <RotateCcw className="w-2.5 h-2.5" />
                            Reset Session
                        </Button>
                    </div>
                )}
            </div>

            {/* ── Phase 2: Resolution Modal ── */}
            {showPhase2 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowPhase2(false)}>
                    <div className="w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto bg-background border border-border rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="p-6 border-b border-border">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-accent border border-border flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-foreground" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-foreground">Phase 2: The Plan</h2>
                                    <p className="text-[10px] text-muted-foreground">
                                        {deliberationRound} deliberation rounds · {summitParticipants.length} participants · {assistantMsgCount} total replies
                                    </p>
                                </div>
                                <Button
                                    onClick={() => setShowPhase2(false)}
                                    variant="ghost"
                                    size="icon-xs"
                                    className="ml-auto text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Topic */}
                        {summitTopic.trim() && (
                            <div className="px-6 py-3 border-b border-border bg-accent/50">
                                <span className="text-[10px] text-muted-foreground">Topic</span>
                                <p className="text-xs text-foreground mt-0.5">"{summitTopic.trim()}"</p>
                            </div>
                        )}

                        {/* Deliberation Summary */}
                        <div className="p-6 border-b border-border space-y-3">
                            <h3 className="text-xs font-semibold text-muted-foreground">Deliberation Summary</h3>
                            <div className="space-y-2">
                                {summitParticipants.map((rpcId) => {
                                    const agent = findAgent(rpcId);
                                    const name = agent ? agentDisplayName(agent) : rpcId;
                                    const color = agentColorMap[rpcId] ?? COLOR_PALETTE[0];
                                    const msgCount = agentMsgCounts[rpcId] ?? 0;
                                    const agentMsgs = summitMessages.filter(m => m.agentId === rpcId && m.role === 'assistant' && !m.streaming);
                                    return (
                                        <div key={rpcId} className={cn("p-3 border rounded-xl", color.border, "bg-accent/30")}>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className={cn("text-xs font-medium", color.text)}>{name}</span>
                                                <span className="text-[10px] text-muted-foreground">{msgCount} contribution{msgCount !== 1 ? 's' : ''}</span>
                                            </div>
                                            {agentMsgs.length > 0 ? (
                                                <p className="text-xs text-muted-foreground leading-relaxed max-h-32 overflow-y-auto pr-2">
                                                    {agentMsgs.map(msg => stripTrailingTags(msg.content).trim()).join(' ')}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-muted-foreground italic">No contributions recorded</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-6 flex items-center gap-3">
                            <Button
                                onClick={() => {
                                    summitParticipants.forEach((rpcId, i) => {
                                        addTask({
                                            id: `task-${Date.now().toString().slice(-4)}-${i}`,
                                            title: summitTopic.trim() ? `Resolution: ${summitTopic.trim()}` : "Deliberation Resolution",
                                            agentId: rpcId,
                                            status: "PENDING",
                                            priority: "HIGH",
                                            updatedAt: Date.now(),
                                            timestamp: new Date().toLocaleTimeString()
                                        });
                                    });

                                    setShowPhase2(false);
                                    clearSummit();
                                    router.push("/tasks");
                                }}
                                className="flex-1 h-auto p-3 rounded-xl text-xs font-medium bg-foreground text-background hover:bg-foreground/90"
                            >
                                <Rocket className="w-4 h-4" />
                                Execute the Plan
                            </Button>
                            <Button
                                onClick={() => {
                                    const summaryLines: string[] = [];

                                    summitParticipants.forEach(rpcId => {
                                        const agent = findAgent(rpcId);
                                        const name = agent ? agentDisplayName(agent) : rpcId;
                                        const agentMsgs = summitMessages.filter(m => m.agentId === rpcId && m.role === 'assistant' && !m.streaming);

                                        if (agentMsgs.length > 0) {
                                            const combinedText = agentMsgs.map(msg => stripTrailingTags(msg.content).trim()).join(' ');
                                            summaryLines.push(`${name}: ${combinedText}`);
                                        }
                                    });

                                    setRefinementContext(summaryLines.join('\n'));
                                    setShowPhase2(false);
                                    setMaxRounds(prev => prev + 3);
                                }}
                                variant="outline"
                                className="flex-1 h-auto p-3 rounded-xl text-xs font-medium"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refine (+3 Rounds)
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
