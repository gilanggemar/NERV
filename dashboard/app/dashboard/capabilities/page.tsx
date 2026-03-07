"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Puzzle, Server, Sparkles, Plus, Trash2, Edit2, RefreshCw,
    Check, X, ChevronRight, Activity, Wrench, Tag, User, Eye,
    FolderOpen, Search, GitBranch, Brain, Globe, Workflow, ShieldCheck,
    Braces, BookOpen, Shield, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useCapabilitiesStore, type CapabilityMcp, type CapabilitySkill } from "@/store/useCapabilitiesStore";
import { useAgentStore } from "@/store/useAgentStore";
import { AGENT_ROSTER } from "@/lib/agentRoster";

// Sort function: active first (alphabetically), then inactive (alphabetically)
function sortByStatusAndName<T extends { status: string; name: string }>(items: T[]): T[] {
    return [...items].sort((a, b) => {
        // Active items come first
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        // Within same status, sort alphabetically
        return a.name.localeCompare(b.name);
    });
}

type Tab = "mcps" | "skills";

// Icon mapping for dynamic icons
const ICON_MAP: Record<string, any> = {
    FolderOpen, Search, GitBranch, Brain, Globe, Workflow, ShieldCheck,
    Braces, BookOpen, Shield, Server, Sparkles, Puzzle, Wrench,
};

function getIcon(iconName: string | null) {
    if (!iconName) return Puzzle;
    return ICON_MAP[iconName] || Puzzle;
}

const STATUS_COLORS: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    inactive: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    error: "bg-red-500/10 text-red-500 border-red-500/20",
    draft: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    healthy: "bg-emerald-500",
    unhealthy: "bg-red-500",
    unknown: "bg-zinc-500",
};

const CATEGORY_COLORS: Record<string, string> = {
    general: "bg-blue-500/10 text-blue-400",
    code: "bg-violet-500/10 text-violet-400",
    data: "bg-teal-500/10 text-teal-400",
    communication: "bg-orange-500/10 text-orange-400",
    productivity: "bg-lime-500/10 text-lime-400",
    custom: "bg-pink-500/10 text-pink-400",
    analysis: "bg-cyan-500/10 text-cyan-400",
    research: "bg-indigo-500/10 text-indigo-400",
    writing: "bg-rose-500/10 text-rose-400",
};

export default function CapabilitiesPage() {
    const {
        mcps, skills, isLoading, isSeeding,
        fetchMcps, fetchSkills, seedDefaults,
        createMcp, updateMcp, deleteMcp, healthCheckMcp,
        createSkill, updateSkill, deleteSkill,
        assignments, fetchAssignmentsForAgent,
        bulkAssign, bulkUnassign,
    } = useCapabilitiesStore();

    const agentsMap = useAgentStore((s) => s.agents);
    // Use AGENT_ROSTER as the canonical agent list, merge with store data for status
    const agents = useMemo(() => {
        return AGENT_ROSTER.map(rosterAgent => {
            const storeAgent = agentsMap[rosterAgent.id];
            return {
                ...rosterAgent,
                status: storeAgent?.status || 'OFFLINE',
                model: storeAgent?.model,
            };
        });
    }, [agentsMap]);

    // Sort MCPs and Skills for stable ordering
    const sortedMcps = useMemo(() => sortByStatusAndName(mcps), [mcps]);
    const sortedSkills = useMemo(() => sortByStatusAndName(skills), [skills]);

    const [tab, setTab] = useState<Tab>("mcps");
    const [addMcpOpen, setAddMcpOpen] = useState(false);
    const [addSkillOpen, setAddSkillOpen] = useState(false);
    const [editingMcp, setEditingMcp] = useState<CapabilityMcp | null>(null);
    const [editingSkill, setEditingSkill] = useState<CapabilitySkill | null>(null);
    const [viewingSkill, setViewingSkill] = useState<CapabilitySkill | null>(null);
    const [assignPanelOpen, setAssignPanelOpen] = useState(false);
    const [assignTarget, setAssignTarget] = useState<{ type: 'mcp' | 'skill'; id: string; name: string } | null>(null);

    // Initial load
    useEffect(() => {
        const load = async () => {
            await fetchMcps();
            await fetchSkills();
        };
        load();
    }, [fetchMcps, fetchSkills]);

    // Auto-seed if empty (only attempt once to prevent infinite loop)
    const hasAttemptedSeed = useRef(false);
    useEffect(() => {
        if (!isLoading && mcps.length === 0 && skills.length === 0 && !isSeeding && !hasAttemptedSeed.current) {
            hasAttemptedSeed.current = true;
            seedDefaults().then(() => {
                toast.success("Default capabilities loaded");
            });
        }
    }, [isLoading, mcps.length, skills.length, isSeeding, seedDefaults]);

    // Load assignments for all agents (stable dependency via serialized IDs)
    const agentIds = useMemo(() => agents.map(a => a.id).sort(), [agents]);
    const agentIdsKey = JSON.stringify(agentIds);
    useEffect(() => {
        for (const id of agentIds) {
            fetchAssignmentsForAgent(id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [agentIdsKey, fetchAssignmentsForAgent]);

    const handleOpenAssignPanel = (type: 'mcp' | 'skill', id: string, name: string) => {
        setAssignTarget({ type, id, name });
        setAssignPanelOpen(true);
    };

    // Stats
    const totalTools = mcps.reduce((sum, m) => sum + (m.tools?.length || 0), 0);
    const activeMcps = mcps.filter(m => m.status === 'active').length;
    const activeSkills = skills.filter(s => s.status === 'active').length;

    return (
        <div className="flex flex-col h-full gap-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">Capabilities</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">Central capability server - MCPs & Skills</p>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => seedDefaults()}
                    disabled={isSeeding}
                    className="rounded-full h-8 px-4 text-xs gap-1.5"
                >
                    <Download className="w-3 h-3" />
                    {isSeeding ? "Seeding..." : "Reset to Defaults"}
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="rounded-xl border-border bg-card shadow-none py-0 gap-0">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-accent/50 flex items-center justify-center">
                                <Wrench className="w-5 h-5 text-foreground" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold text-foreground">{totalTools}</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Tools</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-xl border-border bg-card shadow-none py-0 gap-0">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <Server className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold text-foreground">{activeMcps}</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">MCP Active</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-xl border-border bg-card shadow-none py-0 gap-0">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-violet-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold text-foreground">{activeSkills}</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Skills Active</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tab Strip */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-accent/30 rounded-xl p-1 w-fit">
                    <button
                        onClick={() => setTab("mcps")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === "mcps" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <Server className="w-3.5 h-3.5 inline mr-1.5" />
                        MCP Servers
                    </button>
                    <button
                        onClick={() => setTab("skills")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === "skills" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
                        Skills
                    </button>
                </div>
                <Button
                    size="sm"
                    onClick={() => tab === "mcps" ? setAddMcpOpen(true) : setAddSkillOpen(true)}
                    className="rounded-full h-8 px-4 text-xs bg-foreground text-background hover:bg-foreground/90 gap-1.5"
                >
                    <Plus className="w-3 h-3" />
                    {tab === "mcps" ? "Add MCP Server" : "Create Skill"}
                </Button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
                {tab === "mcps" ? (
                    <McpList
                        mcps={sortedMcps}
                        agents={agents}
                        assignments={assignments}
                        onEdit={setEditingMcp}
                        onDelete={async (id) => { await deleteMcp(id); toast.success("MCP deleted"); }}
                        onHealthCheck={async (id) => { await healthCheckMcp(id); toast.success("Health check complete"); }}
                        onToggleStatus={async (mcp) => {
                            await updateMcp(mcp.id, { status: mcp.status === 'active' ? 'inactive' : 'active' });
                            toast.success(`MCP ${mcp.status === 'active' ? 'deactivated' : 'activated'}`);
                        }}
                        onOpenAssign={handleOpenAssignPanel}
                    />
                ) : (
                    <SkillList
                        skills={sortedSkills}
                        agents={agents}
                        assignments={assignments}
                        onEdit={setEditingSkill}
                        onView={setViewingSkill}
                        onDelete={async (id) => { await deleteSkill(id); toast.success("Skill deleted"); }}
                        onToggleStatus={async (skill) => {
                            await updateSkill(skill.id, { status: skill.status === 'active' ? 'inactive' : 'active' });
                            toast.success(`Skill ${skill.status === 'active' ? 'deactivated' : 'activated'}`);
                        }}
                        onOpenAssign={handleOpenAssignPanel}
                    />
                )}
            </ScrollArea>

            {/* Dialogs */}
            <McpDialog
                open={addMcpOpen || !!editingMcp}
                onOpenChange={(o) => { setAddMcpOpen(o); if (!o) setEditingMcp(null); }}
                mcp={editingMcp}
                onSave={async (data) => {
                    if (editingMcp) {
                        await updateMcp(editingMcp.id, data);
                        toast.success("MCP updated");
                    } else {
                        await createMcp(data);
                        toast.success("MCP created");
                    }
                    setAddMcpOpen(false);
                    setEditingMcp(null);
                }}
            />

            <SkillDialog
                open={addSkillOpen || !!editingSkill}
                onOpenChange={(o) => { setAddSkillOpen(o); if (!o) setEditingSkill(null); }}
                skill={editingSkill}
                onSave={async (data) => {
                    if (editingSkill) {
                        await updateSkill(editingSkill.id, data);
                        toast.success("Skill updated");
                    } else {
                        await createSkill(data);
                        toast.success("Skill created");
                    }
                    setAddSkillOpen(false);
                    setEditingSkill(null);
                }}
            />

            <SkillViewSheet
                skill={viewingSkill}
                onClose={() => setViewingSkill(null)}
                onEdit={() => { setEditingSkill(viewingSkill); setViewingSkill(null); }}
            />

            <AssignmentSheet
                open={assignPanelOpen}
                onClose={() => { setAssignPanelOpen(false); setAssignTarget(null); }}
                target={assignTarget}
                agents={agents}
                assignments={assignments}
                onAssign={bulkAssign}
                onUnassign={bulkUnassign}
            />
        </div>
    );
}

/* ─── MCP List ─── */
function McpList({
    mcps, agents, assignments, onEdit, onDelete, onHealthCheck, onToggleStatus, onOpenAssign,
}: {
    mcps: CapabilityMcp[];
    agents: any[];
    assignments: any[];
    onEdit: (mcp: CapabilityMcp) => void;
    onDelete: (id: string) => Promise<void>;
    onHealthCheck: (id: string) => Promise<void>;
    onToggleStatus: (mcp: CapabilityMcp) => Promise<void>;
    onOpenAssign: (type: 'mcp', id: string, name: string) => void;
}) {
    const getAssignedCount = (mcpId: string) => {
        return assignments.filter(a => a.capability_type === 'mcp' && a.capability_id === mcpId && a.is_enabled).length;
    };

    return (
        <div className="space-y-3 pb-6">
            {mcps.length === 0 ? (
                <Card className="rounded-xl border-dashed border-border bg-card/50 shadow-none">
                    <CardContent className="p-8 text-center">
                        <Server className="w-8 h-8 mx-auto text-muted-foreground/40 mb-3" />
                        <p className="text-sm text-muted-foreground">No MCP servers configured.</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Add an MCP server to provide tools to agents.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <AnimatePresence mode="popLayout">
                        {mcps.map((mcp) => {
                            const Icon = getIcon(mcp.icon);
                            const assignedCount = getAssignedCount(mcp.id);
                            return (
                                <motion.div
                                    key={mcp.id}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                >
                                    <Card className="rounded-xl border-border bg-card shadow-none py-0 gap-0 hover:border-foreground/10 transition-colors">
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-accent/50 flex items-center justify-center shrink-0">
                                                    <Icon className="w-5 h-5 text-foreground" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-sm font-medium text-foreground truncate">{mcp.name}</p>
                                                        <Badge className={`text-[9px] h-4 rounded px-1.5 font-normal border ${STATUS_COLORS[mcp.status]}`}>
                                                            {mcp.status}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">
                                                        {mcp.description || "No description"}
                                                    </p>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Badge variant="secondary" className={`text-[9px] h-4 rounded px-1.5 font-normal ${CATEGORY_COLORS[mcp.category] || ''}`}>
                                                            {mcp.category}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-[9px] h-4 rounded px-1.5 font-normal">
                                                            {mcp.transport}
                                                        </Badge>
                                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                            <Wrench className="w-3 h-3" /> {mcp.tools?.length || 0} tools
                                                        </span>
                                                        {mcp.last_health_status && (
                                                            <span className="flex items-center gap-1">
                                                                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[mcp.last_health_status]}`} />
                                                                <span className="text-[9px] text-muted-foreground">{mcp.last_health_status}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <button
                                                            onClick={() => onOpenAssign('mcp', mcp.id, mcp.name)}
                                                            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                                                        >
                                                            <User className="w-3 h-3" /> {assignedCount}/{agents.length} agents
                                                            <ChevronRight className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost" size="sm"
                                                            className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                                                            onClick={() => onHealthCheck(mcp.id)}
                                                        >
                                                            <RefreshCw className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost" size="sm"
                                                            className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                                                            onClick={() => onEdit(mcp)}
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost" size="sm"
                                                            className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-red-400"
                                                            onClick={() => onDelete(mcp.id)}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                    <Switch
                                                        checked={mcp.status === 'active'}
                                                        onCheckedChange={() => onToggleStatus(mcp)}
                                                        className="scale-75"
                                                    />
                                                </div>
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

/* ─── Skill List ─── */
function SkillList({
    skills, agents, assignments, onEdit, onView, onDelete, onToggleStatus, onOpenAssign,
}: {
    skills: CapabilitySkill[];
    agents: any[];
    assignments: any[];
    onEdit: (skill: CapabilitySkill) => void;
    onView: (skill: CapabilitySkill) => void;
    onDelete: (id: string) => Promise<void>;
    onToggleStatus: (skill: CapabilitySkill) => Promise<void>;
    onOpenAssign: (type: 'skill', id: string, name: string) => void;
}) {
    const getAssignedCount = (skillId: string) => {
        return assignments.filter(a => a.capability_type === 'skill' && a.capability_id === skillId && a.is_enabled).length;
    };

    return (
        <div className="space-y-3 pb-6">
            {skills.length === 0 ? (
                <Card className="rounded-xl border-dashed border-border bg-card/50 shadow-none">
                    <CardContent className="p-8 text-center">
                        <Sparkles className="w-8 h-8 mx-auto text-muted-foreground/40 mb-3" />
                        <p className="text-sm text-muted-foreground">No skills configured.</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Create a skill to enhance agent capabilities.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <AnimatePresence mode="popLayout">
                        {skills.map((skill) => {
                            const Icon = getIcon(skill.icon);
                            const assignedCount = getAssignedCount(skill.id);
                            return (
                                <motion.div
                                    key={skill.id}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                >
                                    <Card className="rounded-xl border-border bg-card shadow-none py-0 gap-0 hover:border-foreground/10 transition-colors">
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                                                    <Icon className="w-5 h-5 text-violet-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-sm font-medium text-foreground truncate">{skill.name}</p>
                                                        <Badge className={`text-[9px] h-4 rounded px-1.5 font-normal border ${STATUS_COLORS[skill.status]}`}>
                                                            {skill.status}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-[9px] h-4 rounded px-1.5 font-normal">
                                                            {skill.author}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">
                                                        {skill.description || "No description"}
                                                    </p>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Badge variant="secondary" className={`text-[9px] h-4 rounded px-1.5 font-normal ${CATEGORY_COLORS[skill.category] || ''}`}>
                                                            {skill.category}
                                                        </Badge>
                                                        <span className="text-[10px] text-muted-foreground">v{skill.version}</span>
                                                        {(skill.tags || []).slice(0, 3).map((tag) => (
                                                            <span key={tag} className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                                                                <Tag className="w-2.5 h-2.5" />{tag}
                                                            </span>
                                                        ))}
                                                        {(skill.tags?.length || 0) > 3 && (
                                                            <span className="text-[9px] text-muted-foreground">+{skill.tags!.length - 3}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <button
                                                            onClick={() => onOpenAssign('skill', skill.id, skill.name)}
                                                            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                                                        >
                                                            <User className="w-3 h-3" /> {assignedCount}/{agents.length} agents
                                                            <ChevronRight className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost" size="sm"
                                                            className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                                                            onClick={() => onView(skill)}
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost" size="sm"
                                                            className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                                                            onClick={() => onEdit(skill)}
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost" size="sm"
                                                            className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-red-400"
                                                            onClick={() => onDelete(skill.id)}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                    <Switch
                                                        checked={skill.status === 'active'}
                                                        onCheckedChange={() => onToggleStatus(skill)}
                                                        className="scale-75"
                                                    />
                                                </div>
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

/* ─── MCP Dialog ─── */
function McpDialog({
    open, onOpenChange, mcp, onSave,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    mcp: CapabilityMcp | null;
    onSave: (data: Partial<CapabilityMcp>) => Promise<void>;
}) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [serverUrl, setServerUrl] = useState("");
    const [transport, setTransport] = useState("stdio");
    const [authType, setAuthType] = useState("none");
    const [category, setCategory] = useState("general");
    const [icon, setIcon] = useState("Server");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (mcp) {
            setName(mcp.name);
            setDescription(mcp.description || "");
            setServerUrl(mcp.server_url);
            setTransport(mcp.transport);
            setAuthType(mcp.auth_type);
            setCategory(mcp.category);
            setIcon(mcp.icon || "Server");
        } else {
            setName(""); setDescription(""); setServerUrl("");
            setTransport("stdio"); setAuthType("none"); setCategory("general"); setIcon("Server");
        }
    }, [mcp, open]);

    const handleSave = async () => {
        if (!name.trim() || !serverUrl.trim()) return;
        setSaving(true);
        try {
            await onSave({
                name: name.trim(),
                description: description.trim() || null,
                server_url: serverUrl.trim(),
                transport,
                auth_type: authType,
                category,
                icon,
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-base">{mcp ? "Edit MCP Server" : "Add MCP Server"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <label className="text-[11px] text-muted-foreground">Name *</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Filesystem"
                            className="h-8 text-[12px] rounded-xl border-border bg-background"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] text-muted-foreground">Description</label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What does this MCP server do?"
                            className="min-h-16 text-[12px] rounded-xl border-border bg-background resize-none"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] text-muted-foreground">Server URL / Command *</label>
                        <Input
                            value={serverUrl}
                            onChange={(e) => setServerUrl(e.target.value)}
                            placeholder="npx -y @modelcontextprotocol/server-xxx"
                            className="h-8 text-[12px] rounded-xl border-border bg-background font-mono"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[11px] text-muted-foreground">Transport</label>
                            <Select value={transport} onValueChange={setTransport}>
                                <SelectTrigger className="h-8 text-[12px] rounded-xl border-border bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="stdio" className="text-xs rounded-lg">stdio</SelectItem>
                                    <SelectItem value="sse" className="text-xs rounded-lg">sse</SelectItem>
                                    <SelectItem value="streamable-http" className="text-xs rounded-lg">streamable-http</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] text-muted-foreground">Auth Type</label>
                            <Select value={authType} onValueChange={setAuthType}>
                                <SelectTrigger className="h-8 text-[12px] rounded-xl border-border bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="none" className="text-xs rounded-lg">None</SelectItem>
                                    <SelectItem value="api_key" className="text-xs rounded-lg">API Key</SelectItem>
                                    <SelectItem value="bearer" className="text-xs rounded-lg">Bearer Token</SelectItem>
                                    <SelectItem value="oauth" className="text-xs rounded-lg">OAuth</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[11px] text-muted-foreground">Category</label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="h-8 text-[12px] rounded-xl border-border bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="general" className="text-xs rounded-lg">General</SelectItem>
                                    <SelectItem value="code" className="text-xs rounded-lg">Code</SelectItem>
                                    <SelectItem value="data" className="text-xs rounded-lg">Data</SelectItem>
                                    <SelectItem value="communication" className="text-xs rounded-lg">Communication</SelectItem>
                                    <SelectItem value="productivity" className="text-xs rounded-lg">Productivity</SelectItem>
                                    <SelectItem value="custom" className="text-xs rounded-lg">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] text-muted-foreground">Icon</label>
                            <Select value={icon} onValueChange={setIcon}>
                                <SelectTrigger className="h-8 text-[12px] rounded-xl border-border bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {Object.keys(ICON_MAP).map((iconName) => (
                                        <SelectItem key={iconName} value={iconName} className="text-xs rounded-lg">
                                            {iconName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
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
                        disabled={saving || !name.trim() || !serverUrl.trim()}
                    >
                        {saving ? "Saving..." : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ─── Skill Dialog ─── */
function SkillDialog({
    open, onOpenChange, skill, onSave,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    skill: CapabilitySkill | null;
    onSave: (data: Partial<CapabilitySkill>) => Promise<void>;
}) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [content, setContent] = useState("");
    const [version, setVersion] = useState("1.0.0");
    const [category, setCategory] = useState("general");
    const [icon, setIcon] = useState("Sparkles");
    const [tagsInput, setTagsInput] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (skill) {
            setName(skill.name);
            setDescription(skill.description || "");
            setContent(skill.content);
            setVersion(skill.version);
            setCategory(skill.category);
            setIcon(skill.icon || "Sparkles");
            setTagsInput((skill.tags || []).join(", "));
        } else {
            setName(""); setDescription(""); setContent("");
            setVersion("1.0.0"); setCategory("general"); setIcon("Sparkles"); setTagsInput("");
        }
    }, [skill, open]);

    const handleSave = async () => {
        if (!name.trim() || !content.trim()) return;
        setSaving(true);
        try {
            await onSave({
                name: name.trim(),
                description: description.trim() || null,
                content: content.trim(),
                version,
                category,
                icon,
                tags: tagsInput.split(",").map(t => t.trim()).filter(Boolean),
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-base">{skill ? "Edit Skill" : "Create Skill"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[11px] text-muted-foreground">Name *</label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Code Review Protocol"
                                className="h-8 text-[12px] rounded-xl border-border bg-background"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] text-muted-foreground">Version</label>
                            <Input
                                value={version}
                                onChange={(e) => setVersion(e.target.value)}
                                placeholder="1.0.0"
                                className="h-8 text-[12px] rounded-xl border-border bg-background"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] text-muted-foreground">Description</label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of what this skill does"
                            className="h-8 text-[12px] rounded-xl border-border bg-background"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] text-muted-foreground">Content (Markdown) *</label>
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="# Skill Instructions&#10;&#10;Write the full skill prompt/instructions here..."
                            className="min-h-48 text-[12px] rounded-xl border-border bg-background resize-none font-mono"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[11px] text-muted-foreground">Category</label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="h-8 text-[12px] rounded-xl border-border bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="general" className="text-xs rounded-lg">General</SelectItem>
                                    <SelectItem value="code" className="text-xs rounded-lg">Code</SelectItem>
                                    <SelectItem value="writing" className="text-xs rounded-lg">Writing</SelectItem>
                                    <SelectItem value="analysis" className="text-xs rounded-lg">Analysis</SelectItem>
                                    <SelectItem value="research" className="text-xs rounded-lg">Research</SelectItem>
                                    <SelectItem value="custom" className="text-xs rounded-lg">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] text-muted-foreground">Icon</label>
                            <Select value={icon} onValueChange={setIcon}>
                                <SelectTrigger className="h-8 text-[12px] rounded-xl border-border bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {Object.keys(ICON_MAP).map((iconName) => (
                                        <SelectItem key={iconName} value={iconName} className="text-xs rounded-lg">
                                            {iconName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] text-muted-foreground">Tags (comma-separated)</label>
                        <Input
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            placeholder="reasoning, analysis, problem-solving"
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
                        disabled={saving || !name.trim() || !content.trim()}
                    >
                        {saving ? "Saving..." : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ─── Skill View Sheet ─── */
function SkillViewSheet({
    skill, onClose, onEdit,
}: {
    skill: CapabilitySkill | null;
    onClose: () => void;
    onEdit: () => void;
}) {
    if (!skill) return null;

    return (
        <Sheet open={!!skill} onOpenChange={(o) => !o && onClose()}>
            <SheetContent className="w-[500px] sm:max-w-[500px]">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        {skill.name}
                        <Badge className={`text-[9px] h-4 rounded px-1.5 font-normal border ${STATUS_COLORS[skill.status]}`}>
                            {skill.status}
                        </Badge>
                    </SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                    <p className="text-sm text-muted-foreground">{skill.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className={`text-[9px] h-4 rounded px-1.5 font-normal ${CATEGORY_COLORS[skill.category] || ''}`}>
                            {skill.category}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">v{skill.version}</span>
                        <span className="text-[10px] text-muted-foreground">by {skill.author}</span>
                    </div>
                    <div className="rounded-xl border border-border bg-accent/20 p-4">
                        <pre className="text-xs text-foreground whitespace-pre-wrap font-mono">
                            {skill.content}
                        </pre>
                    </div>
                    <Button
                        size="sm"
                        onClick={onEdit}
                        className="rounded-full h-8 px-4 text-xs"
                    >
                        <Edit2 className="w-3 h-3 mr-1.5" /> Edit Skill
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}

/* ─── Assignment Sheet ─── */
function AssignmentSheet({
    open, onClose, target, agents, assignments, onAssign, onUnassign,
}: {
    open: boolean;
    onClose: () => void;
    target: { type: 'mcp' | 'skill'; id: string; name: string } | null;
    agents: any[];
    assignments: any[];
    onAssign: (agentIds: string[], type: 'mcp' | 'skill', id: string) => Promise<void>;
    onUnassign: (agentIds: string[], type: 'mcp' | 'skill', id: string) => Promise<void>;
}) {
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    if (!target) return null;

    const getIsAssigned = (agentId: string) => {
        return assignments.some(
            a => a.agent_id === agentId &&
                a.capability_type === target.type &&
                a.capability_id === target.id &&
                a.is_enabled
        );
    };

    const assignedCount = agents.filter(a => getIsAssigned(a.id)).length;

    const handleToggle = async (agentId: string, currentlyAssigned: boolean) => {
        setIsUpdating(agentId);
        try {
            if (currentlyAssigned) {
                await onUnassign([agentId], target.type, target.id);
            } else {
                await onAssign([agentId], target.type, target.id);
            }
        } finally {
            setIsUpdating(null);
        }
    };

    const handleSelectAll = async () => {
        const unassignedIds = agents.filter(a => !getIsAssigned(a.id)).map(a => a.id);
        if (unassignedIds.length > 0) {
            setIsUpdating('all');
            try {
                await onAssign(unassignedIds, target.type, target.id);
            } finally {
                setIsUpdating(null);
            }
        }
    };

    const handleDeselectAll = async () => {
        const assignedIds = agents.filter(a => getIsAssigned(a.id)).map(a => a.id);
        if (assignedIds.length > 0) {
            setIsUpdating('all');
            try {
                await onUnassign(assignedIds, target.type, target.id);
            } finally {
                setIsUpdating(null);
            }
        }
    };

    return (
        <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
            <SheetContent className="w-[420px] sm:max-w-[420px]">
                <SheetHeader className="pb-4 border-b border-border">
                    <SheetTitle className="text-base flex items-center gap-2">
                        {target.type === 'mcp' ? <Server className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                        Assign "{target.name}"
                    </SheetTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                        {assignedCount} of {agents.length} agents have access
                    </p>
                </SheetHeader>
                <div className="py-4 space-y-4">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAll}
                            disabled={isUpdating !== null}
                            className="rounded-full h-8 px-4 text-xs flex-1"
                        >
                            <Check className="w-3 h-3 mr-1.5" /> Assign All
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDeselectAll}
                            disabled={isUpdating !== null}
                            className="rounded-full h-8 px-4 text-xs flex-1"
                        >
                            <X className="w-3 h-3 mr-1.5" /> Remove All
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {agents.map((agent) => {
                            const isAssigned = getIsAssigned(agent.id);
                            const isLoading = isUpdating === agent.id || isUpdating === 'all';
                            return (
                                <div
                                    key={agent.id}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                        isAssigned
                                            ? 'bg-emerald-500/5 border-emerald-500/20'
                                            : 'bg-card border-border hover:border-foreground/10'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold"
                                            style={{
                                                backgroundColor: `${agent.colorHex}20`,
                                                color: agent.colorHex,
                                            }}
                                        >
                                            {agent.avatarFallback || agent.name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{agent.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{agent.role}</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={isAssigned}
                                        disabled={isLoading}
                                        onCheckedChange={() => handleToggle(agent.id, isAssigned)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
