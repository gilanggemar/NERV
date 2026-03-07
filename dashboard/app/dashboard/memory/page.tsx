"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Brain, MessageSquare, Lightbulb, Search, Plus, Trash2,
    ChevronRight, Hash, Star, BookOpen, FileText, Users, Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useMemoryStore } from "@/store/useMemoryStore";
import { MessageRenderer } from "@/components/chat/MessageRenderer";
import type { Conversation, KnowledgeFragment } from "@/lib/memory/types";

type Tab = "conversations" | "knowledge";

const SOURCE_ICONS: Record<string, any> = {
    chat: MessageSquare,
    summit: Users,
    file: FileText,
    manual: BookOpen,
    command: Terminal,
};

export default function MemoryPage() {
    const {
        conversations, messages, knowledge, isLoading,
        activeConversationId, activeAgentFilter,
        setActiveAgentFilter, fetchConversations, fetchMessages, fetchKnowledge,
    } = useMemoryStore();

    const [tab, setTab] = useState<Tab>("conversations");
    const [knowledgeSearch, setKnowledgeSearch] = useState("");
    const [addKnowledgeOpen, setAddKnowledgeOpen] = useState(false);

    useEffect(() => {
        if (tab === "conversations") {
            fetchConversations(activeAgentFilter !== 'all' ? activeAgentFilter : undefined);
        } else {
            fetchKnowledge(activeAgentFilter !== 'all' ? activeAgentFilter : "all", knowledgeSearch || undefined);
        }
    }, [tab, activeAgentFilter, fetchConversations, fetchKnowledge, knowledgeSearch]);

    const handleDeleteConversation = useCallback(async (id: string) => {
        if (!confirm("Delete this conversation and all messages?")) return;
        try {
            await fetch(`/api/memory/conversations/${id}`, { method: "DELETE" });
            fetchConversations(activeAgentFilter !== 'all' ? activeAgentFilter : undefined);
        } catch (e) {
            console.error("Failed to delete:", e);
        }
    }, [fetchConversations, activeAgentFilter]);

    const handleDeleteKnowledge = useCallback(async (id: string) => {
        try {
            await fetch(`/api/memory/knowledge/${id}`, { method: "DELETE" });
            fetchKnowledge(activeAgentFilter !== 'all' ? activeAgentFilter : "all", knowledgeSearch || undefined);
        } catch (e) {
            console.error("Failed to delete:", e);
        }
    }, [fetchKnowledge, activeAgentFilter, knowledgeSearch]);

    return (
        <div className="flex flex-col h-full gap-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3">
                <h1 className="text-xl font-semibold tracking-tight text-foreground">Memory</h1>
                <div className="flex items-center gap-2">
                    <Select value={activeAgentFilter} onValueChange={setActiveAgentFilter}>
                        <SelectTrigger className="h-8 w-32 text-[12px] rounded-xl border-border bg-background">
                            <SelectValue placeholder="All Agents" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="all" className="text-xs rounded-lg">All Agents</SelectItem>
                            <SelectItem value="daisy" className="text-xs rounded-lg">Daisy</SelectItem>
                            <SelectItem value="ivy" className="text-xs rounded-lg">Ivy</SelectItem>
                            <SelectItem value="celia" className="text-xs rounded-lg">Celia</SelectItem>
                            <SelectItem value="thalia" className="text-xs rounded-lg">Thalia</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Tab Strip */}
            <div className="flex items-center gap-1 bg-accent/30 rounded-xl p-1 w-fit">
                <button
                    onClick={() => setTab("conversations")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === "conversations" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <MessageSquare className="w-3.5 h-3.5 inline mr-1.5" />
                    Conversations
                </button>
                <button
                    onClick={() => setTab("knowledge")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === "knowledge" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <Lightbulb className="w-3.5 h-3.5 inline mr-1.5" />
                    Knowledge Base
                </button>
            </div>

            <ScrollArea className="flex-1">
                {tab === "conversations" ? (
                    <ConversationList
                        conversations={conversations}
                        messages={messages}
                        activeId={activeConversationId}
                        onSelect={fetchMessages}
                        onDelete={handleDeleteConversation}
                    />
                ) : (
                    <KnowledgeList
                        knowledge={knowledge}
                        searchQuery={knowledgeSearch}
                        onSearchChange={setKnowledgeSearch}
                        onDelete={handleDeleteKnowledge}
                        onAddOpen={() => setAddKnowledgeOpen(true)}
                    />
                )}
            </ScrollArea>

            {/* Add Knowledge Dialog */}
            <AddKnowledgeDialog
                open={addKnowledgeOpen}
                onOpenChange={setAddKnowledgeOpen}
                agentId={activeAgentFilter || "all"}
                onAdded={() => fetchKnowledge(activeAgentFilter || "all")}
            />
        </div>
    );
}

/* ─── Conversation List ─── */
function ConversationList({
    conversations, messages, activeId, onSelect, onDelete,
}: {
    conversations: Conversation[];
    messages: any[];
    activeId: string | null;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    return (
        <div className="space-y-3 pb-6">
            <h2 className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" /> Conversation History
            </h2>

            {conversations.length === 0 ? (
                <Card className="rounded-xl border-dashed border-border bg-card/50 shadow-none">
                    <CardContent className="p-8 text-center">
                        <Brain className="w-8 h-8 mx-auto text-muted-foreground/40 mb-3" />
                        <p className="text-sm text-muted-foreground">No conversations stored.</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Conversations will appear as agents interact.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {/* Conversation list */}
                    <div className="space-y-1.5">
                        <AnimatePresence mode="popLayout">
                            {conversations.map((convo) => (
                                <motion.div
                                    key={convo.id}
                                    layout
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                >
                                    <Card
                                        className={`rounded-xl border-border shadow-none py-0 gap-0 cursor-pointer transition-colors ${activeId === convo.id ? "border-foreground/20 bg-accent/50" : "bg-card hover:border-foreground/10"
                                            }`}
                                        onClick={() => onSelect(convo.id)}
                                    >
                                        <CardContent className="p-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs font-medium text-foreground truncate">{convo.title}</p>
                                                        <Badge variant="secondary" className="text-[10px] h-4 rounded px-1.5 font-normal shrink-0">
                                                            {convo.agentId}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                                        {convo.messageCount} messages · {new Date(convo.updatedAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost" size="sm"
                                                        className="h-6 w-6 p-0 rounded-lg text-muted-foreground hover:text-red-400"
                                                        onClick={(e) => { e.stopPropagation(); onDelete(convo.id); }}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                    <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Message preview */}
                    <Card className="rounded-xl border-border bg-card shadow-none py-0 gap-0">
                        <CardContent className="p-0">
                            {activeId && messages.length > 0 ? (
                                <ScrollArea className="h-80">
                                    <div className="p-3 space-y-2">
                                        {messages.map((msg: any, i: number) => (
                                            <div
                                                key={i}
                                                className={`text-[11px] rounded-lg px-3 py-2 ${msg.role === "user"
                                                    ? "bg-accent/50 text-foreground ml-8"
                                                    : msg.role === "system"
                                                        ? "bg-blue-500/5 text-blue-400/80 border border-blue-500/10"
                                                        : "bg-card text-muted-foreground mr-8"
                                                    }`}
                                            >
                                                <span className="text-[9px] uppercase tracking-wider text-muted-foreground/40 block mb-0.5">
                                                    {msg.role}
                                                </span>
                                                <div className="w-full"><MessageRenderer content={msg.content} /></div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            ) : (
                                <div className="h-80 flex items-center justify-center text-muted-foreground/40 text-xs">
                                    Select a conversation to preview
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

/* ─── Knowledge List ─── */
function KnowledgeList({
    knowledge, searchQuery, onSearchChange, onDelete, onAddOpen,
}: {
    knowledge: KnowledgeFragment[];
    searchQuery: string;
    onSearchChange: (q: string) => void;
    onDelete: (id: string) => void;
    onAddOpen: () => void;
}) {
    return (
        <div className="space-y-3 pb-6">
            <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Lightbulb className="w-3.5 h-3.5" /> Knowledge Fragments
                </h2>
                <Button
                    size="sm"
                    onClick={onAddOpen}
                    className="rounded-full h-8 px-4 text-xs bg-foreground text-background hover:bg-foreground/90 gap-1.5"
                >
                    <Plus className="w-3 h-3" /> Add
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search knowledge..."
                    className="h-8 pl-9 text-[12px] rounded-xl border-border bg-background"
                />
            </div>

            {knowledge.length === 0 ? (
                <Card className="rounded-xl border-dashed border-border bg-card/50 shadow-none">
                    <CardContent className="p-8 text-center">
                        <Lightbulb className="w-8 h-8 mx-auto text-muted-foreground/40 mb-3" />
                        <p className="text-sm text-muted-foreground">No knowledge stored.</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Add knowledge fragments to enrich agent context.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2 max-w-2xl">
                    <AnimatePresence mode="popLayout">
                        {knowledge.map((frag) => {
                            const SourceIcon = SOURCE_ICONS[frag.source] || BookOpen;
                            return (
                                <motion.div
                                    key={frag.id}
                                    layout
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                >
                                    <Card className="rounded-xl border-border bg-card shadow-none py-0 gap-0">
                                        <CardContent className="p-3">
                                            <div className="flex items-start gap-3">
                                                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-accent/50 text-muted-foreground shrink-0 mt-0.5">
                                                    <SourceIcon className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[11px] text-foreground whitespace-pre-wrap break-words line-clamp-3">
                                                        {frag.content}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Badge variant="secondary" className="text-[9px] h-4 rounded px-1.5 font-normal">
                                                            {frag.source}
                                                        </Badge>
                                                        {frag.tags?.map((tag) => (
                                                            <span key={tag} className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                                                                <Hash className="w-2.5 h-2.5" />{tag}
                                                            </span>
                                                        ))}
                                                        <span className="text-[9px] text-amber-400/60 flex items-center gap-0.5 ml-auto">
                                                            <Star className="w-2.5 h-2.5" />{frag.importance}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost" size="sm"
                                                    className="h-6 w-6 p-0 rounded-lg text-muted-foreground hover:text-red-400 shrink-0"
                                                    onClick={() => onDelete(frag.id)}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

/* ─── Add Knowledge Dialog ─── */
function AddKnowledgeDialog({
    open, onOpenChange, agentId, onAdded,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    agentId: string;
    onAdded: () => void;
}) {
    const [content, setContent] = useState("");
    const [source, setSource] = useState("manual");
    const [tags, setTags] = useState("");
    const [importance, setImportance] = useState("5");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!content.trim()) return;
        setSaving(true);
        try {
            await fetch("/api/memory/knowledge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    agentId,
                    content: content.trim(),
                    source,
                    tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
                    importance: parseInt(importance),
                }),
            });
            setContent(""); setTags(""); setImportance("5");
            onAdded();
            onOpenChange(false);
        } catch (e) {
            console.error("Failed to add knowledge:", e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-base">Add Knowledge</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <label className="text-[11px] text-muted-foreground">Content</label>
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Enter knowledge fragment..."
                            className="min-h-24 text-[13px] rounded-xl border-border bg-background resize-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[11px] text-muted-foreground">Source</label>
                            <Select value={source} onValueChange={setSource}>
                                <SelectTrigger className="h-8 text-[12px] rounded-xl border-border bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="manual" className="text-xs rounded-lg">Manual</SelectItem>
                                    <SelectItem value="chat" className="text-xs rounded-lg">Chat</SelectItem>
                                    <SelectItem value="summit" className="text-xs rounded-lg">Summit</SelectItem>
                                    <SelectItem value="file" className="text-xs rounded-lg">File</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] text-muted-foreground">Importance (1-10)</label>
                            <Input
                                type="number" min={1} max={10}
                                value={importance}
                                onChange={(e) => setImportance(e.target.value)}
                                className="h-8 text-[12px] rounded-xl border-border bg-background"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] text-muted-foreground">Tags (comma-separated)</label>
                        <Input
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="api, deployment, bugfix"
                            className="h-8 text-[12px] rounded-xl border-border bg-background"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost" size="sm" className="rounded-full h-8 px-4 text-xs">Cancel</Button>
                    </DialogClose>
                    <Button
                        size="sm"
                        className="rounded-full h-8 px-5 text-xs bg-foreground text-background hover:bg-foreground/90"
                        onClick={handleSave}
                        disabled={saving || !content.trim()}
                    >
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
