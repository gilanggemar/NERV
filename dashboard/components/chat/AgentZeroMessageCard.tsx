'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Wrench, Brain, Info, Zap } from 'lucide-react';

/* ─── Types ─── */

export interface AgentZeroJSON {
    thoughts?: string[];
    headline?: string;
    tool_name?: string;
    tool_args?: Record<string, any>;
    detail?: string;
}

/* ─── Parser ─── */

export function tryParseAgentZeroJSON(content: string): AgentZeroJSON | null {
    if (!content || typeof content !== 'string') return null;

    let jsonStr = content.trim();

    // Strip markdown code fences if present
    if (jsonStr.startsWith('```')) {
        const lines = jsonStr.split('\n');
        if (lines.length > 2) {
            jsonStr = lines.slice(1, lines[lines.length - 1].trim().startsWith('```') ? -1 : lines.length).join('\n').trim();
        }
    }

    // Must look like JSON
    if (!jsonStr.startsWith('{')) return null;

    try {
        const parsed = JSON.parse(jsonStr);
        // Validate it's an Agent Zero response (needs at least one signature field)
        if (parsed && typeof parsed === 'object' && (parsed.headline || parsed.tool_name || parsed.thoughts)) {
            return parsed as AgentZeroJSON;
        }
    } catch {
        // Not valid JSON — fall through
    }

    return null;
}

/* ─── Card Component ─── */

export function AgentZeroMessageCard({ data }: { data: AgentZeroJSON }) {
    return (
        <div className="flex flex-col gap-2.5 w-full text-sm">
            {/* Summary / Headline */}
            {data.headline && (
                <div className="flex items-center gap-2">
                    <Zap size={13} className="text-orange-400 shrink-0" />
                    <span className="font-semibold text-[13px] text-foreground leading-snug">
                        {data.headline}
                    </span>
                </div>
            )}

            {/* Item / Tool Name */}
            {data.tool_name && (
                <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground/60 uppercase text-[9px] tracking-wider font-medium flex items-center gap-1.5">
                        <Wrench size={10} className="opacity-60" />
                        Item
                    </span>
                    <span className="font-mono text-[11px] text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded w-fit">
                        {data.tool_name}
                    </span>
                </div>
            )}

            {/* Steps / Thoughts */}
            {data.thoughts && data.thoughts.length > 0 && (
                <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground/60 uppercase text-[9px] tracking-wider font-medium flex items-center gap-1.5">
                        <Brain size={10} className="opacity-60" />
                        Steps
                    </span>
                    <ul className="list-none flex flex-col gap-0.5 text-[12px] text-muted-foreground/90">
                        {data.thoughts.map((step, i) => (
                            <li key={i} className="flex items-start gap-1.5 leading-snug">
                                <span className="text-cyan-400/60 text-[10px] font-mono mt-0.5 shrink-0">{i + 1}.</span>
                                <span>{step}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Input / Tool Args */}
            {data.tool_args && Object.keys(data.tool_args).length > 0 && (
                <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground/60 uppercase text-[9px] tracking-wider font-medium">Input</span>
                    <div className="bg-black/30 p-2 rounded-md overflow-x-auto border border-white/5 max-h-[120px]">
                        <pre className="text-[10px] font-mono text-muted-foreground/80 m-0 whitespace-pre-wrap">
                            {JSON.stringify(data.tool_args, null, 2)}
                        </pre>
                    </div>
                </div>
            )}

            {/* Detail */}
            {data.detail && (
                <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground/70">
                    <Info size={10} className="mt-0.5 shrink-0 opacity-50" />
                    <span className="leading-snug">{data.detail}</span>
                </div>
            )}
        </div>
    );
}
