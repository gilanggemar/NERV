"use client";

import dynamic from "next/dynamic";
import { useSocketStore } from "@/lib/useSocket";
import { useChatRouter } from "@/lib/useChatRouter";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useMemo, UIEvent } from "react";
import {
    Bot, User, Loader2, MessageSquare, Activity, Terminal as TerminalIcon, Wifi, WifiOff, PanelRightOpen, PanelRightClose, ArrowDown
} from "lucide-react";
import {
    IconPlus, IconPaperclip, IconCode, IconWorld, IconHistory,
    IconWand, IconSend, IconChevronDown
} from "@tabler/icons-react";
import { MessageRenderer } from "@/components/chat/MessageRenderer";

import { AgentAvatar } from "@/components/agents/AgentAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PromptChunkTray } from "@/components/prompt-chunks/PromptChunkTray";
import { ChatInputWithChunks } from "@/components/prompt-chunks/ChatInputWithChunks";

const UnifiedProcessTree = dynamic(
    () => import("@/components/chat/UnifiedProcessTree").then(mod => mod.UnifiedProcessTree),
    { ssr: false }
);

const ChatHistorySidebar = dynamic(
    () => import("@/components/chat/ChatHistorySidebar").then(mod => mod.ChatHistorySidebar),
    { ssr: false }
);
import { usePromptChunkStore } from "@/store/usePromptChunkStore";

import { parseOpenClawToolCalls } from "@/lib/openclawToolParser";
import { AgentZeroMessageCard, tryParseAgentZeroJSON } from "@/components/chat/AgentZeroMessageCard";

/* ─── Message Content Renderer (Clean Text Only) ─── */
const renderMessageContent = (content: string) => {
    if (!content) return null;

    // Detect Agent Zero structured JSON → render as clean card
    const a0Data = tryParseAgentZeroJSON(content);
    if (a0Data) return <AgentZeroMessageCard data={a0Data} />;

    // Use brace-counting parser to strip inline tool markup cleanly
    const { cleanedText } = parseOpenClawToolCalls(content);

    // Also strip any residual XML-like tags
    let finalContent = cleanedText
        .replace(/<\/?(?:final|function|tool|call|response)[^>]*>?\s*$/i, '')
        .replace(/<\/[a-zA-Z]*>?\s*$/i, '')
        .trim();

    if (!finalContent) return null;
    return <MessageRenderer content={finalContent} />;
};

/* ─── Page Component ─── */
export default function ChatPage() {
    const { integratedAgents, getMessagesForAgent, dispatchMessage, isOpenClawConnected } = useChatRouter();
    const { sessions } = useSocketStore();
    const router = useRouter();
    const [message, setMessage] = useState("");
    const [selectedAgentId, setSelectedAgentId] = useState<string>("");
    const [selectedSessionKey, setSelectedSessionKey] = useState<string>("");
    const [autoMode, setAutoMode] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
    const [processSidebarWidth, setProcessSidebarWidth] = useState(350);
    const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { chunks } = usePromptChunkStore();

    // Sidebar resize logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDraggingSidebar) return;
            const newWidth = document.body.clientWidth - e.clientX;
            setProcessSidebarWidth(Math.max(250, Math.min(newWidth, 800)));
        };

        const handleMouseUp = () => setIsDraggingSidebar(false);

        if (isDraggingSidebar) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = 'none'; // Prevent text selection while dragging
            document.body.style.cursor = 'col-resize';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        };
    }, [isDraggingSidebar]);

    // Sync selected agent
    useEffect(() => {
        if (!selectedAgentId && integratedAgents.length > 0) {
            setSelectedAgentId(integratedAgents[0].id);
        }
    }, [integratedAgents, selectedAgentId]);

    // Agent sessions
    const agentSessions = useMemo(() => {
        if (!selectedAgentId) return [];
        return sessions.filter((s: any) => s.agentId === selectedAgentId);
    }, [sessions, selectedAgentId]);

    // Default to webchat session
    useEffect(() => {
        if (agentSessions.length > 0 && !selectedSessionKey) {
            const webchat = agentSessions.find((s: any) => s.key?.includes('webchat'));
            setSelectedSessionKey(webchat?.key || agentSessions[0]?.key || "");
        }
    }, [agentSessions, selectedSessionKey]);

    // Filter messages
    const filteredMessages = useMemo(() => {
        if (!selectedAgentId) return [];
        return getMessagesForAgent(selectedAgentId);
    }, [selectedAgentId, getMessagesForAgent, integratedAgents]);

    const [showScrollBottom, setShowScrollBottom] = useState(false);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight <= 100;
            // Also auto-scroll if it's the first render or we have very few messages
            if (isNearBottom || scrollTop === 0) {
                scrollRef.current.scrollTop = scrollHeight;
            }
        }
    }, [filteredMessages]);

    const handleScroll = (e: UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const distFromBottom = scrollHeight - scrollTop - clientHeight;
        setShowScrollBottom(distFromBottom > 200);
    };

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        const activeAgent = integratedAgents.find(a => a.id === selectedAgentId);
        const isAgentOnline = activeAgent?.isOnline;

        if (!message.trim() || !isAgentOnline || !selectedAgentId) return;
        const sessionKey = selectedSessionKey || `agent:${selectedAgentId}:webchat`;

        let resolvedMessage = message;
        resolvedMessage = resolvedMessage.replace(/⟦([^⟧]+)⟧/g, (match, name) => {
            const chunk = chunks.find(c => c.name === name);
            return chunk ? chunk.content : match;
        });

        dispatchMessage(selectedAgentId, resolvedMessage.trim(), sessionKey);
        setMessage("");
    };

    const handleEscalate = () => {
        if (!selectedAgentId) return;
        const context = filteredMessages.slice(-5).map(m => m.content).join('\n');
        sessionStorage.setItem('nerv_escalation_topic', `[ESCALATION from ${selectedAgentId}]:\n${context}`);
        router.push('/summit');
    };

    // Get display name for selected agent
    const selectedAgentName = useMemo(() => {
        const agent = integratedAgents.find((a: any) => a.id === selectedAgentId);
        return agent?.name || 'Agent';
    }, [integratedAgents, selectedAgentId]);

    const activeAgent = integratedAgents.find(a => a.id === selectedAgentId);
    const isGlobalOrAgentConnected = activeAgent?.provider === 'agent-zero' ? activeAgent.isOnline : isOpenClawConnected;
    const isAgentZero = activeAgent?.provider === 'agent-zero' || activeAgent?.provider === 'external';

    return (
        <div className="flex h-full gap-0">
            {/* Main Chat Area */}
            <div className="flex flex-col flex-1 h-full gap-4 min-w-0">
                {/* Header (Agent Selector + Action Buttons) */}
                <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide shrink-0">
                        {integratedAgents.map((agent: any) => {
                            const isSelected = selectedAgentId === agent.id;
                            const isOnline = agent.isOnline;
                            const isExternal = agent.provider === 'agent-zero' || agent.provider === 'external';

                            return (
                                <button
                                    key={agent.id}
                                    onClick={() => { setSelectedAgentId(agent.id); setSelectedSessionKey(""); setActiveConversationId(undefined); }}
                                    className={cn(
                                        "relative flex items-center text-xs h-8 px-4 gap-2.5 transition-all flex-shrink-0 rounded-full",
                                        isSelected
                                            ? "bg-orange-500/15 text-orange-400 border-2 border-orange-500/50 ring-2 ring-orange-500/20"
                                            : "bg-zinc-900/60 text-muted-foreground border border-zinc-800 hover:border-zinc-600 hover:text-foreground hover:bg-zinc-800/60"
                                    )}
                                >
                                    <div className={cn(
                                        "w-1.5 h-1.5 rounded-full shrink-0 transition-all",
                                        isOnline ? "bg-emerald-400" : "bg-zinc-600"
                                    )} />
                                    <span className="font-medium">{agent.name}</span>
                                </button>
                            );
                        })}

                        {/* Session select */}
                        {agentSessions.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-3 rounded-full text-xs text-muted-foreground hover:text-foreground ml-1"
                                    >
                                        <span>{selectedSessionKey?.split(':')?.[2] || 'session'}</span>
                                        <IconChevronDown className="size-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="rounded-2xl p-1.5">
                                    <DropdownMenuGroup className="space-y-1">
                                        {agentSessions.map((s: any) => (
                                            <DropdownMenuItem
                                                key={s.key}
                                                className="rounded-[calc(1rem-6px)] text-xs"
                                                onClick={() => setSelectedSessionKey(s.key)}
                                            >
                                                {s.key?.split(':')?.[2] || s.key || 'session'}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            onClick={handleEscalate}
                            disabled={!selectedAgentId || filteredMessages.length === 0}
                            variant="outline"
                            size="sm"
                            className="text-xs text-muted-foreground hover:text-foreground rounded-full h-8 px-4 gap-2 disabled:opacity-30"
                        >
                            <Activity className="w-3 h-3" />
                            Escalate to Summit
                        </Button>
                        <Button
                            onClick={() => setShowHistory(!showHistory)}
                            variant="outline"
                            size="sm"
                            className={cn(
                                "h-8 px-3 rounded-full gap-1.5 text-xs",
                                showHistory
                                    ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
                                    : "text-muted-foreground border-border"
                            )}
                        >
                            {showHistory ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
                            History
                        </Button>
                    </div>
                </div>

                {/* Main Content (Chat + Process Side Panel) */}
                <div className="flex-1 min-h-0 bg-transparent flex w-full gap-4">
                    {/* Chat Tab Content */}
                    <div className="flex-1 flex flex-col m-0 min-h-0">
                        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto w-full pr-[20px] pb-5 relative flex flex-col pt-5">
                            {filteredMessages.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-60 gap-3">
                                    <MessageSquare className="w-10 h-10" />
                                    <p className="text-sm">
                                        {selectedAgentId ? "No messages yet — start a conversation" : "Select an agent to begin"}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col mt-auto w-full justify-end">
                                    {filteredMessages.map((msg, idx) => {
                                        const isFirstInGroup = idx === 0 || filteredMessages[idx - 1].role !== msg.role;

                                        // Left-aligned logic for both User and Agent
                                        const isUser = msg.role === 'user';
                                        const displayName = isUser ? 'You' : selectedAgentName;

                                        return (
                                            <div key={msg.id} className={cn("flex w-full justify-start", isFirstInGroup ? "mt-[12px]" : "mt-[4px]")}>
                                                <div className="flex-shrink-0 mr-[12px] w-[42px] flex flex-col justify-start items-center relative mt-[5px]">
                                                    {isFirstInGroup ? (
                                                        isUser ? (
                                                            <div className="w-[42px] h-[56px] rounded-[8px] flex items-center justify-center bg-orange-500/20 border border-orange-500/30">
                                                                <User className="w-5 h-5 text-orange-500" />
                                                            </div>
                                                        ) : (
                                                            <AgentAvatar agentId={selectedAgentId!} name={selectedAgentName} width={42} height={56} />
                                                        )
                                                    ) : (
                                                        <div className="w-[42px]" />
                                                    )}
                                                </div>

                                                <div className="flex flex-col items-start min-w-0 flex-1">
                                                    {isFirstInGroup && (
                                                        <div className="flex items-center gap-1.5 mb-[2px] px-1">
                                                            <span className="text-[13px] font-semibold text-foreground">{displayName}</span>
                                                            <span className="text-[11px] text-muted-foreground">· {msg.timestamp}</span>
                                                        </div>
                                                    )}

                                                    {/* Chat bubbles are clean — tool calls go to Process Hierarchy */}
                                                    {renderMessageContent(msg.content) && (
                                                        <div className={cn(
                                                            "px-[12px] py-[6px] text-[13px] leading-relaxed max-w-[85%] min-w-[80px] w-fit",
                                                            isUser
                                                                ? "bg-accent text-foreground"
                                                                : "bg-orange-500/35 text-white border border-orange-500/40",
                                                            isFirstInGroup ? "rounded-[12px]" : "rounded-tr-[12px] rounded-br-[12px] rounded-bl-[12px] rounded-tl-[4px]"
                                                        )}>
                                                            {renderMessageContent(msg.content)}
                                                            {msg.streaming && <Loader2 className="inline-block w-3 h-3 ml-1 text-muted-foreground animate-spin" />}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {showScrollBottom && (
                                <button
                                    onClick={scrollToBottom}
                                    className="fixed bottom-[130px] right-[40px] z-50 p-2 rounded-full bg-background/60 backdrop-blur-md border border-border/50 text-foreground shadow-lg hover:bg-accent transition-all flex items-center justify-center"
                                >
                                    <ArrowDown className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Blocks.so-style Chat Input */}
                        <div className="pt-2 pb-0 w-full">
                            <div className="bg-background border border-border shadow-sm rounded-3xl overflow-hidden focus-within:ring-1 focus-within:ring-border/50 transition-all">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    className="sr-only"
                                    onChange={(e) => { }}
                                />

                                <div className="px-3 pt-3 pb-2 grow">
                                    <form onSubmit={handleSendMessage}>
                                        <ChatInputWithChunks
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            onSend={handleSendMessage}
                                            placeholder={activeAgent?.isOnline ? "Ask anything" : "Connection offline"}
                                            disabled={!activeAgent?.isOnline || !selectedAgentId}
                                            className="w-full bg-transparent! p-0 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder-muted-foreground resize-none border-none outline-none text-[13px] min-h-10 max-h-[25vh]"
                                            rows={1}
                                            onInput={(e) => {
                                                const target = e.target as HTMLTextAreaElement;
                                                target.style.height = "auto";
                                                target.style.height = target.scrollHeight + "px";
                                            }}
                                        />
                                    </form>
                                </div>

                                <div className="mb-2 px-2 flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 rounded-full border border-border hover:bg-accent"
                                                >
                                                    <IconPlus className="size-3" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="max-w-xs rounded-2xl p-1.5">
                                                <DropdownMenuGroup className="space-y-1">
                                                    <DropdownMenuItem
                                                        className="rounded-[calc(1rem-6px)] text-xs"
                                                        onClick={() => fileInputRef.current?.click()}
                                                    >
                                                        <IconPaperclip size={16} className="opacity-60" />
                                                        Attach Files
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="rounded-[calc(1rem-6px)] text-xs">
                                                        <IconCode size={16} className="opacity-60" />
                                                        Code Interpreter
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="rounded-[calc(1rem-6px)] text-xs">
                                                        <IconWorld size={16} className="opacity-60" />
                                                        Web Search
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="rounded-[calc(1rem-6px)] text-xs"
                                                        onClick={() => setShowHistory(true)}
                                                    >
                                                        <IconHistory size={16} className="opacity-60" />
                                                        Chat History
                                                    </DropdownMenuItem>
                                                </DropdownMenuGroup>
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setAutoMode(!autoMode)}
                                            className={cn(
                                                "h-7 px-2 rounded-full border border-border hover:bg-accent",
                                                {
                                                    "bg-primary/10 text-primary border-primary/30": autoMode,
                                                    "text-muted-foreground": !autoMode,
                                                }
                                            )}
                                        >
                                            <IconWand className="size-3" />
                                            <span className="text-xs">Auto</span>
                                        </Button>

                                        <div className="ml-1 w-px h-4 bg-border" />
                                        <PromptChunkTray />
                                    </div>

                                    <div>
                                        <Button
                                            type="submit"
                                            disabled={!message.trim() || !activeAgent?.isOnline}
                                            className="size-7 p-0 rounded-full bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={handleSendMessage}
                                        >
                                            <IconSend className="size-3 text-primary-foreground" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Persistent Process Hierarchy Sidebar — shown for ALL agents */}
                    {selectedAgentId && (
                        <div className="flex h-full shrink-0 group relative" style={{ width: processSidebarWidth }}>
                            {/* Resize Handle */}
                            <div
                                className="absolute -left-1.5 top-0 bottom-0 w-3 cursor-col-resize z-10 flex items-center justify-center"
                                onMouseDown={() => setIsDraggingSidebar(true)}
                            >
                                <div className="w-0.5 h-12 bg-zinc-700/0 group-hover:bg-zinc-700/50 rounded-full transition-colors duration-300" />
                            </div>

                            <div className="w-full h-full border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/30">
                                <UnifiedProcessTree
                                    agentId={selectedAgentId}
                                    provider={activeAgent?.provider || 'openclaw'}
                                    className="h-full"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat History Sidebar */}
            {showHistory && selectedAgentId && (
                <ChatHistorySidebar
                    agentId={selectedAgentId}
                    agentName={selectedAgentName}
                    className="w-72 shrink-0"
                    activeConversationId={activeConversationId}
                    onSelectConversation={setActiveConversationId}
                />
            )}
        </div>
    );
}
