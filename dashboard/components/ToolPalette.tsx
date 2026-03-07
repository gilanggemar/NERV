"use client";

import { Wrench, Server, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MCPServer, MCPTool } from "@/lib/mcp/types";

interface ToolPaletteProps {
    servers: MCPServer[];
    agentId: string;
}

export function ToolPalette({ servers, agentId }: ToolPaletteProps) {
    const agentServers = servers.filter(
        (s) => s.assignedAgents.includes(agentId) && s.status === "connected"
    );

    if (agentServers.length === 0) {
        return (
            <div className="text-[10px] text-muted-foreground/40 flex items-center gap-1.5 py-1">
                <Wrench className="w-3 h-3" /> No tools connected
            </div>
        );
    }

    return (
        <div className="space-y-1.5">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground/40 flex items-center gap-1">
                <Wrench className="w-2.5 h-2.5" /> Available Tools
            </div>
            {agentServers.map((srv) => (
                <div key={srv.id} className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded flex items-center justify-center bg-accent/30 text-muted-foreground/50 shrink-0 mt-0.5">
                        <Server className="w-2.5 h-2.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-muted-foreground font-medium">{srv.name}</span>
                        <div className="flex items-center gap-1 flex-wrap mt-0.5">
                            {srv.tools.map((tool) => (
                                <Badge key={tool.name} variant="secondary" className="text-[8px] h-3.5 rounded px-1 font-normal">
                                    {tool.name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

interface ToolUsageIndicatorProps {
    toolName: string;
    status: "running" | "completed" | "failed";
}

export function ToolUsageIndicator({ toolName, status }: ToolUsageIndicatorProps) {
    return (
        <div className="flex items-center gap-1.5 text-[10px]">
            {status === "running" ? (
                <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
            ) : status === "completed" ? (
                <Wrench className="w-3 h-3 text-emerald-400" />
            ) : (
                <Wrench className="w-3 h-3 text-red-400" />
            )}
            <span className="text-muted-foreground font-mono">{toolName}</span>
            <Badge variant="secondary" className={`text-[8px] h-3 rounded px-1 font-normal ${status === "running" ? "text-blue-400" : status === "completed" ? "text-emerald-400" : "text-red-400"
                }`}>
                {status}
            </Badge>
        </div>
    );
}
