"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plug2, Plus, Trash2, RefreshCw, CheckCircle2, XCircle,
    Loader2, Server, Wrench, Users, Shield, Globe, ArrowRight, Puzzle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { useMCPStore } from "@/store/useMCPStore";
import { PRESET_SERVERS } from "@/lib/mcp/types";
import type { MCPServer, MCPTransport } from "@/lib/mcp/types";

const STATUS_ICONS: Record<string, { icon: any; color: string }> = {
    connected: { icon: CheckCircle2, color: "text-emerald-400" },
    disconnected: { icon: XCircle, color: "text-muted-foreground/50" },
    error: { icon: XCircle, color: "text-red-400" },
    testing: { icon: Loader2, color: "text-blue-400" },
};

export default function MCPServersPage() {
    const { servers, isLoading, fetchServers, testServer } = useMCPStore();
    const [createOpen, setCreateOpen] = useState(false);

    useEffect(() => { fetchServers(); }, [fetchServers]);

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm("Remove this MCP server?")) return;
        await fetch(`/api/mcp/servers/${id}`, { method: "DELETE" });
        fetchServers();
    }, [fetchServers]);

    const handleAssign = useCallback(async (serverId: string, agentId: string, current: string[]) => {
        const agents = current.includes(agentId) ? current.filter((a) => a !== agentId) : [...current, agentId];
        await fetch(`/api/mcp/servers/${serverId}`, {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assignedAgents: agents }),
        });
        fetchServers();
    }, [fetchServers]);

    return (
        <div className="flex flex-col h-full gap-5">
            {/* Migration Banner */}
            <Link href="/dashboard/capabilities">
                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/15 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Puzzle className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">MCP servers are now managed in the Capabilities hub</p>
                            <p className="text-[11px] text-muted-foreground">The new Capabilities page provides enhanced MCP management with skills and agent assignments.</p>
                        </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-blue-400" />
                </div>
            </Link>

            <div className="flex items-center justify-between pb-3">
                <h1 className="text-xl font-semibold tracking-tight text-foreground">MCP Servers (Legacy)</h1>
                <Button size="sm" className="rounded-full h-8 px-4 text-xs bg-foreground text-background hover:bg-foreground/90 gap-1.5"
                    onClick={() => setCreateOpen(true)}>
                    <Plus className="w-3 h-3" /> Add Server
                </Button>
            </div>

            {/* Preset quick-add */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Quick add:</span>
                {PRESET_SERVERS.map((p) => (
                    <Button key={p.name} variant="outline" size="sm"
                        className="h-6 px-2.5 text-[10px] rounded-full border-border bg-card hover:bg-accent/50 gap-1"
                        onClick={async () => {
                            await fetch("/api/mcp/servers", {
                                method: "POST", headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ name: p.name, url: p.url, transport: p.transport, description: p.description }),
                            });
                            fetchServers();
                        }}>
                        <Server className="w-2.5 h-2.5" />{p.name}
                    </Button>
                ))}
            </div>

            <ScrollArea className="flex-1">
                <div className="space-y-2 pb-6 max-w-3xl">
                    {servers.length === 0 ? (
                        <Card className="rounded-xl border-dashed border-border bg-card/50 shadow-none">
                            <CardContent className="p-8 text-center">
                                <Plug2 className="w-8 h-8 mx-auto text-muted-foreground/40 mb-3" />
                                <p className="text-sm text-muted-foreground">No MCP servers configured.</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">Add servers to give agents access to external tools.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {servers.map((srv) => {
                                const statusCfg = STATUS_ICONS[srv.status] || STATUS_ICONS.disconnected;
                                const StatusIcon = statusCfg.icon;
                                return (
                                    <motion.div key={srv.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                                        <Card className="rounded-xl border-border bg-card shadow-none py-0 gap-0">
                                            <CardContent className="p-4">
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-accent/50 ${statusCfg.color} shrink-0`}>
                                                        <StatusIcon className={`w-4 h-4 ${srv.status === 'testing' ? 'animate-spin' : ''}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <p className="text-sm font-medium text-foreground">{srv.name}</p>
                                                            <Badge variant="secondary" className="text-[9px] h-3.5 rounded px-1 font-normal">{srv.transport}</Badge>
                                                            <Badge variant="secondary" className={`text-[9px] h-3.5 rounded px-1 font-normal ${statusCfg.color}`}>
                                                                {srv.status}
                                                            </Badge>
                                                        </div>
                                                        {srv.description && <p className="text-[11px] text-muted-foreground mb-1">{srv.description}</p>}
                                                        <p className="text-[10px] text-muted-foreground/50 font-mono truncate mb-2">{srv.url}</p>

                                                        {/* Tools */}
                                                        {srv.tools.length > 0 && (
                                                            <div className="flex items-center gap-1 flex-wrap mb-2">
                                                                <Wrench className="w-2.5 h-2.5 text-muted-foreground/40" />
                                                                {srv.tools.map((t) => (
                                                                    <span key={t.name} className="text-[9px] px-1.5 py-0.5 rounded bg-accent/50 text-muted-foreground">{t.name}</span>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Assigned agents */}
                                                        <div className="flex items-center gap-1">
                                                            <Users className="w-2.5 h-2.5 text-muted-foreground/40" />
                                                            {["daisy", "ivy", "celia", "thalia"].map((agent) => (
                                                                <button key={agent} onClick={() => handleAssign(srv.id, agent, srv.assignedAgents)}
                                                                    className={`text-[9px] px-1.5 py-0.5 rounded capitalize transition-colors ${srv.assignedAgents.includes(agent) ? "bg-foreground/10 text-foreground" : "bg-accent/30 text-muted-foreground/40 hover:text-muted-foreground"
                                                                        }`}>
                                                                    {agent}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <Button variant="ghost" size="sm" className="h-7 px-2 rounded-lg text-xs text-muted-foreground hover:text-blue-400 gap-1"
                                                            onClick={() => testServer(srv.id)}>
                                                            <RefreshCw className="w-3 h-3" /> Test
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-red-400"
                                                            onClick={() => handleDelete(srv.id)}>
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>
            </ScrollArea>

            <CreateServerDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={fetchServers} />
        </div>
    );
}

function CreateServerDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: () => void }) {
    const [name, setName] = useState("");
    const [url, setUrl] = useState("");
    const [transport, setTransport] = useState<MCPTransport>("stdio");
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);

    const handleCreate = async () => {
        if (!name.trim() || !url.trim()) return;
        setSaving(true);
        try {
            await fetch("/api/mcp/servers", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), url: url.trim(), transport, description: description.trim() || undefined }),
            });
            setName(""); setUrl(""); setDescription("");
            onCreated(); onOpenChange(false);
        } catch (e) { console.error(e); } finally { setSaving(false); }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader><DialogTitle className="text-base">Add MCP Server</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <label className="text-[11px] text-muted-foreground">Name</label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My MCP Server" className="h-8 text-[13px] rounded-xl border-border bg-background" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] text-muted-foreground">URL / Command</label>
                        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="npx -y @modelcontextprotocol/server-filesystem" className="h-8 text-[13px] rounded-xl border-border bg-background font-mono" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] text-muted-foreground">Transport</label>
                        <Select value={transport} onValueChange={(v) => setTransport(v as MCPTransport)}>
                            <SelectTrigger className="h-8 text-[12px] rounded-xl border-border bg-background"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="stdio" className="text-xs rounded-lg">stdio</SelectItem>
                                <SelectItem value="sse" className="text-xs rounded-lg">SSE</SelectItem>
                                <SelectItem value="http" className="text-xs rounded-lg">HTTP</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] text-muted-foreground">Description</label>
                        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" className="h-8 text-[13px] rounded-xl border-border bg-background" />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost" size="sm" className="rounded-full h-8 px-4 text-xs">Cancel</Button></DialogClose>
                    <Button size="sm" className="rounded-full h-8 px-5 text-xs bg-foreground text-background hover:bg-foreground/90" onClick={handleCreate} disabled={saving || !name.trim() || !url.trim()}>Add</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
