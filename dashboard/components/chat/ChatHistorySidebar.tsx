"use client";

import React, { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    MessageSquare,
    Plus,
    Trash2,
    Clock,
    ChevronRight
} from 'lucide-react';

interface Conversation {
    id: string;
    agentId: string;
    title: string;
    messageCount: number;
    createdAt: number;
    updatedAt: number;
}

interface ChatHistorySidebarProps {
    agentId: string;
    agentName: string;
    className?: string;
    onSelectConversation?: (conversationId: string) => void;
    activeConversationId?: string;
}

export const ChatHistorySidebar = ({
    agentId,
    agentName,
    className,
    onSelectConversation,
    activeConversationId
}: ChatHistorySidebarProps) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch conversations for this agent
    const fetchConversations = async () => {
        if (!agentId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/memory/conversations?agentId=${agentId}`);
            if (res.ok) {
                const data = await res.json();
                setConversations(data);
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConversations();
    }, [agentId]);

    const handleNewConversation = async () => {
        try {
            const res = await fetch('/api/memory/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentId,
                    title: `Chat with ${agentName} - ${new Date().toLocaleDateString()}`
                })
            });
            if (res.ok) {
                const newConvo = await res.json();
                setConversations(prev => [newConvo, ...prev]);
                onSelectConversation?.(newConvo.id);
            }
        } catch (error) {
            console.error('Failed to create conversation:', error);
        }
    };

    const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const res = await fetch(`/api/memory/conversations/${conversationId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setConversations(prev => prev.filter(c => c.id !== conversationId));
            }
        } catch (error) {
            console.error('Failed to delete conversation:', error);
        }
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className={cn(
            "flex flex-col h-full border-l border-border bg-zinc-950/95 backdrop-blur-sm",
            className
        )}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                <div className="flex flex-col">
                    <span className="text-xs font-medium text-foreground">Chat History</span>
                    <span className="text-[10px] text-muted-foreground">{agentName}</span>
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleNewConversation}
                    className="h-7 w-7 p-0 rounded-full hover:bg-accent"
                >
                    <Plus className="w-3.5 h-3.5" />
                </Button>
            </div>

            {/* Conversation List */}
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {loading ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground">
                            <span className="text-xs">Loading...</span>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                            <MessageSquare className="w-8 h-8 text-muted-foreground/30 mb-2" />
                            <span className="text-xs text-muted-foreground">No chat history</span>
                            <span className="text-[10px] text-muted-foreground/70 mt-1">
                                Start a conversation with {agentName}
                            </span>
                        </div>
                    ) : (
                        conversations.map((convo) => (
                            <div
                                key={convo.id}
                                onClick={() => onSelectConversation?.(convo.id)}
                                className={cn(
                                    "group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all",
                                    "hover:bg-accent/50",
                                    activeConversationId === convo.id
                                        ? "bg-orange-500/10 border border-orange-500/30"
                                        : "border border-transparent"
                                )}
                            >
                                <MessageSquare className={cn(
                                    "w-3.5 h-3.5 shrink-0",
                                    activeConversationId === convo.id
                                        ? "text-orange-500"
                                        : "text-muted-foreground"
                                )} />

                                <div className="flex-1 min-w-0">
                                    <p className={cn(
                                        "text-xs truncate",
                                        activeConversationId === convo.id
                                            ? "text-orange-500 font-medium"
                                            : "text-foreground"
                                    )}>
                                        {convo.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <Clock className="w-2.5 h-2.5 text-muted-foreground/50" />
                                        <span className="text-[9px] text-muted-foreground/70">
                                            {formatDate(convo.updatedAt)}
                                        </span>
                                        <span className="text-[9px] text-muted-foreground/50">
                                            • {convo.messageCount} msgs
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => handleDeleteConversation(convo.id, e)}
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>

                                <ChevronRight className={cn(
                                    "w-3 h-3 shrink-0 transition-transform",
                                    activeConversationId === convo.id
                                        ? "text-orange-500"
                                        : "text-muted-foreground/30"
                                )} />
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            {/* Footer */}
            {conversations.length > 0 && (
                <div className="px-4 py-2 border-t border-border/50">
                    <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">
                        {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                    </span>
                </div>
            )}
        </div>
    );
};

export default ChatHistorySidebar;
