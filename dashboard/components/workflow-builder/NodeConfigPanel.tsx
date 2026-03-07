"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Bot, MessageSquare, Wrench, GitBranch, Code, Flag, Users, PlusCircle, Trash2, Timer } from "lucide-react";
import { useWorkflowBuilderStore } from "@/store/useWorkflowBuilderStore";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ICONS: Record<string, React.ReactNode> = {
    trigger: <Zap size={14} />, agent: <Bot size={14} />, prompt: <MessageSquare size={14} />,
    tool: <Wrench size={14} />, condition: <GitBranch size={14} />, transform: <Code size={14} />,
    output: <Flag size={14} />, summit: <Users size={14} />, delay: <Timer size={14} />,
};
const LABELS: Record<string, string> = {
    trigger: "Trigger", agent: "Agent", prompt: "Prompt", tool: "Tool",
    condition: "Condition", transform: "Transform", output: "Output", summit: "Summit", group: "Group", delay: "Delay",
};

export default function NodeConfigPanel() {
    const selectedNodeId = useWorkflowBuilderStore((s) => s.selectedNodeId);
    const configPanelOpen = useWorkflowBuilderStore((s) => s.configPanelOpen);
    const nodes = useWorkflowBuilderStore((s) => s.nodes);
    const updateNodeData = useWorkflowBuilderStore((s) => s.updateNodeData);
    const removeNode = useWorkflowBuilderStore((s) => s.removeNode);
    const setConfigPanelOpen = useWorkflowBuilderStore((s) => s.setConfigPanelOpen);

    const node = nodes.find((n) => n.id === selectedNodeId);
    const nt = node?.type || "";
    const d = (node?.data || {}) as Record<string, unknown>;
    const upd = (k: string, v: unknown) => { if (selectedNodeId) updateNodeData(selectedNodeId, { [k]: v }); };

    return (
        <AnimatePresence>
            {configPanelOpen && node && (
                <motion.div
                    initial={{ x: 240, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 240, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{
                        position: "absolute", top: 0, right: 0, width: 240, height: "100%",
                        zIndex: 30, background: "oklch(0.13 0.005 0 / 0.7)",
                        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
                        borderLeft: "1px solid oklch(1 0 0 / 0.08)",
                        boxShadow: "-8px 0 40px oklch(0 0 0 / 0.3)",
                        display: "flex", flexDirection: "column", overflow: "hidden",
                    }}
                >
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "10px 12px", borderBottom: "1px solid oklch(1 0 0 / 0.06)",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ color: "var(--text-secondary)" }}>{ICONS[nt]}</span>
                            <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)" }}>
                                {LABELS[nt] || nt}
                            </span>
                        </div>
                        <button onClick={() => setConfigPanelOpen(false)}
                            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 2 }}>
                            <X size={12} />
                        </button>
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>
                        <F label="Node Name">
                            <Input value={(d.label as string) || ""} onChange={(e) => upd("label", e.target.value)}
                                className="h-7 text-[11px] rounded-lg border-border bg-background/50" />
                        </F>

                        {nt === "trigger" && <TriggerCfg d={d} upd={upd} />}
                        {nt === "agent" && <AgentCfg d={d} upd={upd} />}
                        {nt === "prompt" && <PromptCfg d={d} upd={upd} />}
                        {nt === "tool" && <ToolCfg d={d} upd={upd} />}
                        {nt === "condition" && <ConditionCfg d={d} upd={upd} />}
                        {nt === "transform" && <TransformCfg d={d} upd={upd} />}
                        {nt === "output" && <OutputCfg d={d} upd={upd} />}
                        {nt === "summit" && <SummitCfg d={d} upd={upd} />}
                        {nt === "delay" && <DelayCfg d={d} upd={upd} />}
                    </div>

                    <div style={{ padding: "8px 12px", borderTop: "1px solid oklch(1 0 0 / 0.06)" }}>
                        <button onClick={() => { if (selectedNodeId) removeNode(selectedNodeId); }}
                            style={{
                                width: "100%", padding: "5px 10px", borderRadius: 6,
                                border: "1px solid oklch(1 0 0 / 0.06)", background: "none",
                                color: "var(--status-error)", fontSize: 10, fontWeight: 600, cursor: "pointer",
                            }}>
                            Delete Node
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label style={{
                display: "block", fontSize: 9, fontWeight: 600, textTransform: "uppercase",
                letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 4
            }}>
                {label}
            </label>
            {children}
        </div>
    );
}

type Cfg = { d: Record<string, unknown>; upd: (k: string, v: unknown) => void };

// ─── TRIGGER CONFIG (Specialized per type) ───────────────────────────────────

function TriggerCfg({ d, upd }: Cfg) {
    const triggerType = (d.triggerType as string) || "Manual";

    return (<>
        <F label="Trigger Type">
            <Select value={triggerType} onValueChange={(v) => upd("triggerType", v)}>
                <SelectTrigger className="h-7 text-[11px] rounded-lg bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="Manual">Manual</SelectItem>
                    <SelectItem value="Schedule">Schedule</SelectItem>
                    <SelectItem value="Webhook">Webhook</SelectItem>
                    <SelectItem value="Event">Event</SelectItem>
                </SelectContent>
            </Select>
        </F>

        {triggerType === "Manual" && <ManualTriggerCfg d={d} upd={upd} />}
        {triggerType === "Schedule" && <ScheduleTriggerCfg d={d} upd={upd} />}
        {triggerType === "Webhook" && <WebhookTriggerCfg d={d} upd={upd} />}
        {triggerType === "Event" && <EventTriggerCfg d={d} upd={upd} />}
    </>);
}

function ManualTriggerCfg({ d, upd }: Cfg) {
    return (<>
        <F label="Manual Mode">
            <Select value={(d.manualMode as string) || "click"} onValueChange={(v) => upd("manualMode", v)}>
                <SelectTrigger className="h-7 text-[11px] rounded-lg bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="click">Click Trigger</SelectItem>
                    <SelectItem value="message">Message Trigger</SelectItem>
                    <SelectItem value="prompt">Prompt Trigger</SelectItem>
                </SelectContent>
            </Select>
        </F>
        {(d.manualMode as string) === "prompt" && (
            <F label="Prompt Text">
                <Textarea value={(d.promptText as string) || ""} onChange={(e) => upd("promptText", e.target.value)}
                    placeholder="Enter prompt to auto-send on execute"
                    className="min-h-16 text-[11px] rounded-lg border-border bg-background/50 resize-none" />
            </F>
        )}
    </>);
}

function ScheduleTriggerCfg({ d, upd }: Cfg) {
    return (<>
        <F label="Schedule Type">
            <Select value={(d.scheduleType as string) || "cron"} onValueChange={(v) => upd("scheduleType", v)}>
                <SelectTrigger className="h-7 text-[11px] rounded-lg bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="cron">Cron Expression</SelectItem>
                    <SelectItem value="interval">Fixed Interval</SelectItem>
                    <SelectItem value="daily">Daily At</SelectItem>
                </SelectContent>
            </Select>
        </F>
        {(d.scheduleType as string) === "cron" && (
            <F label="Cron Expression">
                <Input value={(d.cronExpression as string) || ""} onChange={(e) => upd("cronExpression", e.target.value)}
                    placeholder="*/5 * * * *" className="h-7 text-[11px] rounded-lg border-border bg-background/50 font-mono" />
            </F>
        )}
        {(d.scheduleType as string) === "interval" && (<>
            <F label="Every (seconds)">
                <Input type="number" min={1} value={(d.intervalSeconds as number) || 60}
                    onChange={(e) => upd("intervalSeconds", parseInt(e.target.value) || 60)}
                    className="h-7 text-[11px] rounded-lg border-border bg-background/50" />
            </F>
        </>)}
        {(d.scheduleType as string) === "daily" && (
            <F label="Time (HH:MM)">
                <Input type="time" value={(d.dailyTime as string) || "09:00"}
                    onChange={(e) => upd("dailyTime", e.target.value)}
                    className="h-7 text-[11px] rounded-lg border-border bg-background/50" />
            </F>
        )}
        <F label="Timezone">
            <Select value={(d.timezone as string) || "UTC"} onValueChange={(v) => upd("timezone", v)}>
                <SelectTrigger className="h-7 text-[11px] rounded-lg bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">US Eastern</SelectItem>
                    <SelectItem value="America/Los_Angeles">US Pacific</SelectItem>
                    <SelectItem value="Europe/London">UK</SelectItem>
                    <SelectItem value="Asia/Tokyo">Japan</SelectItem>
                    <SelectItem value="Asia/Jakarta">WIB (Jakarta)</SelectItem>
                </SelectContent>
            </Select>
        </F>
    </>);
}

function WebhookTriggerCfg({ d, upd }: Cfg) {
    return (<>
        <F label="HTTP Method">
            <Select value={(d.httpMethod as string) || "POST"} onValueChange={(v) => upd("httpMethod", v)}>
                <SelectTrigger className="h-7 text-[11px] rounded-lg bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                </SelectContent>
            </Select>
        </F>
        <F label="Endpoint Path">
            <Input value={(d.webhookPath as string) || ""} onChange={(e) => upd("webhookPath", e.target.value)}
                placeholder="/api/webhook/my-flow" className="h-7 text-[11px] rounded-lg border-border bg-background/50 font-mono" />
        </F>
        <F label="Authentication">
            <Select value={(d.webhookAuth as string) || "none"} onValueChange={(v) => upd("webhookAuth", v)}>
                <SelectTrigger className="h-7 text-[11px] rounded-lg bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="api_key">API Key</SelectItem>
                    <SelectItem value="bearer">Bearer Token</SelectItem>
                    <SelectItem value="hmac">HMAC Signature</SelectItem>
                </SelectContent>
            </Select>
        </F>
        {(d.webhookAuth as string) && (d.webhookAuth as string) !== "none" && (
            <F label="Secret / Key">
                <Input type="password" value={(d.webhookSecret as string) || ""}
                    onChange={(e) => upd("webhookSecret", e.target.value)}
                    placeholder="Enter secret" className="h-7 text-[11px] rounded-lg border-border bg-background/50" />
            </F>
        )}
        <F label="Content Type">
            <Select value={(d.contentType as string) || "json"} onValueChange={(v) => upd("contentType", v)}>
                <SelectTrigger className="h-7 text-[11px] rounded-lg bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="json">application/json</SelectItem>
                    <SelectItem value="form">x-www-form-urlencoded</SelectItem>
                    <SelectItem value="text">text/plain</SelectItem>
                </SelectContent>
            </Select>
        </F>
    </>);
}

function EventTriggerCfg({ d, upd }: Cfg) {
    return (<>
        <F label="Event Source">
            <Select value={(d.eventSource as string) || "system"} onValueChange={(v) => upd("eventSource", v)}>
                <SelectTrigger className="h-7 text-[11px] rounded-lg bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="system">System Events</SelectItem>
                    <SelectItem value="agent">Agent Events</SelectItem>
                    <SelectItem value="workflow">Workflow Events</SelectItem>
                    <SelectItem value="external">External (MCP)</SelectItem>
                </SelectContent>
            </Select>
        </F>
        <F label="Event Name">
            <Input value={(d.eventName as string) || ""} onChange={(e) => upd("eventName", e.target.value)}
                placeholder="e.g. agent.task.completed" className="h-7 text-[11px] rounded-lg border-border bg-background/50 font-mono" />
        </F>
        <F label="Filter Condition">
            <Textarea value={(d.eventFilter as string) || ""} onChange={(e) => upd("eventFilter", e.target.value)}
                placeholder='e.g. event.agent === "daisy"'
                className="min-h-12 text-[11px] rounded-lg border-border bg-background/50 resize-none font-mono" />
        </F>
    </>);
}

// ─── OTHER NODE CONFIGS ──────────────────────────────────────────────────────

function AgentCfg({ d, upd }: Cfg) {
    return (<>
        <F label="Agent Name">
            <Input value={(d.agentName as string) || ""} onChange={(e) => upd("agentName", e.target.value)}
                placeholder="e.g. Daisy" className="h-7 text-[11px] rounded-lg border-border bg-background/50" />
        </F>
        <F label="Provider">
            <Select value={(d.provider as string) || "OpenClaw"} onValueChange={(v) => upd("provider", v)}>
                <SelectTrigger className="h-7 text-[11px] rounded-lg bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="OpenClaw">OpenClaw</SelectItem>
                    <SelectItem value="Agent Zero">Agent Zero</SelectItem>
                </SelectContent>
            </Select>
        </F>
        <F label="Instruction">
            <Textarea value={(d.prompt as string) || ""} onChange={(e) => upd("prompt", e.target.value)}
                placeholder="What should this agent do?" className="min-h-14 text-[11px] rounded-lg border-border bg-background/50 resize-none" />
        </F>
    </>);
}

function PromptCfg({ d, upd }: Cfg) {
    return (
        <F label="Prompt Template">
            <Textarea value={(d.promptText as string) || ""} onChange={(e) => upd("promptText", e.target.value)}
                placeholder="Use {{variable}} for interpolation"
                className="min-h-24 text-[11px] rounded-lg border-border bg-background/50 resize-none font-mono" />
        </F>
    );
}

function ToolCfg({ d, upd }: Cfg) {
    return (<>
        <F label="Tool Name">
            <Input value={(d.toolName as string) || ""} onChange={(e) => upd("toolName", e.target.value)}
                placeholder="e.g. read_file" className="h-7 text-[11px] rounded-lg border-border bg-background/50" />
        </F>
        <F label="MCP Server">
            <Input value={(d.serverName as string) || ""} onChange={(e) => upd("serverName", e.target.value)}
                placeholder="e.g. filesystem" className="h-7 text-[11px] rounded-lg border-border bg-background/50" />
        </F>
    </>);
}

function ConditionCfg({ d, upd }: Cfg) {
    return (
        <F label="Condition">
            <Textarea value={(d.expression as string) || ""} onChange={(e) => upd("expression", e.target.value)}
                placeholder='e.g. {{input.status}} === "success"'
                className="min-h-12 text-[11px] rounded-lg border-border bg-background/50 resize-none font-mono" />
        </F>
    );
}

function TransformCfg({ d, upd }: Cfg) {
    return (<>
        <F label="Language">
            <Select value={(d.language as string) || "JS"} onValueChange={(v) => upd("language", v)}>
                <SelectTrigger className="h-7 text-[11px] rounded-lg bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="JS">JavaScript</SelectItem>
                    <SelectItem value="Python">Python</SelectItem>
                </SelectContent>
            </Select>
        </F>
        <F label="Code">
            <Textarea value={(d.code as string) || ""} onChange={(e) => upd("code", e.target.value)}
                placeholder="// transform input" className="min-h-20 text-[11px] rounded-lg border-border bg-background/50 resize-none font-mono" />
        </F>
    </>);
}

function OutputCfg({ d, upd }: Cfg) {
    return (
        <F label="Output Type">
            <Select value={(d.outputType as string) || "Webhook"} onValueChange={(v) => upd("outputType", v)}>
                <SelectTrigger className="h-7 text-[11px] rounded-lg bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="Webhook">Webhook</SelectItem>
                    <SelectItem value="Notification">Notification</SelectItem>
                    <SelectItem value="Database">Database</SelectItem>
                    <SelectItem value="File">File</SelectItem>
                </SelectContent>
            </Select>
        </F>
    );
}

function DelayCfg({ d, upd }: Cfg) {
    return (
        <F label="Delay (ms)">
            <Input type="number" min={100} step={100} value={(d.delayMs as number) || 1000}
                onChange={(e) => upd("delayMs", parseInt(e.target.value) || 1000)}
                className="h-7 text-[11px] rounded-lg border-border bg-background/50" />
        </F>
    );
}

// ─── Summit Config ──────────────────────────────────────────────────────────

const AVAILABLE_AGENTS = ["Daisy", "Ivy", "Celia", "Thalia", "Agent Zero"];

function SummitCfg({ d, upd }: Cfg) {
    const agents = (d.agents as string[]) || [];
    const topic = (d.topic as string) || "";
    const rounds = (d.rounds as number) || 3;

    const addAgent = (name: string) => {
        if (!agents.includes(name)) upd("agents", [...agents, name]);
    };
    const removeAgent = (name: string) => {
        upd("agents", agents.filter((a) => a !== name));
    };

    return (<>
        <F label="Participants">
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {agents.map((a) => (
                    <div key={a} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "3px 6px", borderRadius: 6, background: "oklch(1 0 0 / 0.04)",
                        fontSize: 10, color: "var(--text-secondary)",
                    }}>
                        <span>{a}</span>
                        <button onClick={() => removeAgent(a)} style={{
                            background: "none", border: "none", color: "var(--text-muted)",
                            cursor: "pointer", padding: 1,
                        }}>
                            <Trash2 size={10} />
                        </button>
                    </div>
                ))}
                <Select onValueChange={addAgent}>
                    <SelectTrigger className="h-7 text-[11px] rounded-lg bg-background/50">
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <PlusCircle size={10} /> Add Agent
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        {AVAILABLE_AGENTS.filter((a) => !agents.includes(a)).map((a) => (
                            <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </F>

        <F label="Topic of Discussion">
            <Textarea value={topic} onChange={(e) => upd("topic", e.target.value)}
                placeholder="What should the agents discuss?"
                className="min-h-16 text-[11px] rounded-lg border-border bg-background/50 resize-none" />
        </F>

        <F label="Deliberation Rounds">
            <Input type="number" min={1} max={10} value={rounds}
                onChange={(e) => upd("rounds", parseInt(e.target.value) || 3)}
                className="h-7 text-[11px] rounded-lg border-border bg-background/50" />
        </F>

        <F label="Outputs">
            <div style={{ fontSize: 9, color: "var(--text-muted)", lineHeight: 1.5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
                    <span style={{ padding: "1px 4px", borderRadius: 3, background: "oklch(0.55 0.14 290 / 0.1)", color: "var(--accent-violet)", fontSize: 8, fontWeight: 600 }}>TEXT</span>
                    Agreed prompt result
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ padding: "1px 4px", borderRadius: 3, background: "oklch(0.72 0.14 195 / 0.1)", color: "var(--accent-teal)", fontSize: 8, fontWeight: 600 }}>EXEC</span>
                    Agreed execution task
                </div>
            </div>
        </F>
    </>);
}
