import React from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Filter, Info, AlertTriangle, XCircle, Bug } from "lucide-react";

export type LogSeverity = 'info' | 'warn' | 'error' | 'debug';

interface ConsoleFiltersProps {
    activeFilters: LogSeverity[];
    onFilterChange: (filters: LogSeverity[]) => void;
    counts?: Record<LogSeverity, number>;
}

export function ConsoleFilters({ activeFilters, onFilterChange, counts }: ConsoleFiltersProps) {
    return (
        <div className="flex items-center gap-4 bg-black/20 p-2 rounded-lg border border-border/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-muted-foreground pl-2">
                <Filter className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Severity</span>
            </div>

            <ToggleGroup
                type="multiple"
                value={activeFilters}
                onValueChange={(val) => onFilterChange(val as LogSeverity[])}
                className="justify-start gap-2"
            >
                <ToggleGroupItem
                    value="info"
                    aria-label="Toggle Info Logs"
                    className="data-[state=on]:bg-blue-500/20 data-[state=on]:text-blue-400 gap-2 h-8 px-3 text-xs border border-transparent data-[state=on]:border-blue-500/30"
                >
                    <Info className="w-3.5 h-3.5" />
                    INFO
                    {counts && counts.info !== undefined && (
                        <span className="opacity-50 text-[10px] ml-1">{counts.info}</span>
                    )}
                </ToggleGroupItem>

                <ToggleGroupItem
                    value="warn"
                    aria-label="Toggle Warning Logs"
                    className="data-[state=on]:bg-amber-500/20 data-[state=on]:text-amber-400 gap-2 h-8 px-3 text-xs border border-transparent data-[state=on]:border-amber-500/30"
                >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    WARN
                    {counts && counts.warn !== undefined && (
                        <span className="opacity-50 text-[10px] ml-1">{counts.warn}</span>
                    )}
                </ToggleGroupItem>

                <ToggleGroupItem
                    value="error"
                    aria-label="Toggle Error Logs"
                    className="data-[state=on]:bg-red-500/20 data-[state=on]:text-red-400 gap-2 h-8 px-3 text-xs border border-transparent data-[state=on]:border-red-500/30"
                >
                    <XCircle className="w-3.5 h-3.5" />
                    ERROR
                    {counts && counts.error !== undefined && (
                        <span className="opacity-50 text-[10px] ml-1">{counts.error}</span>
                    )}
                </ToggleGroupItem>

                <ToggleGroupItem
                    value="debug"
                    aria-label="Toggle Debug Logs"
                    className="data-[state=on]:bg-zinc-500/20 data-[state=on]:text-zinc-300 gap-2 h-8 px-3 text-xs border border-transparent data-[state=on]:border-zinc-500/30"
                >
                    <Bug className="w-3.5 h-3.5" />
                    DEBUG
                    {counts && counts.debug !== undefined && (
                        <span className="opacity-50 text-[10px] ml-1">{counts.debug}</span>
                    )}
                </ToggleGroupItem>
            </ToggleGroup>
        </div>
    );
}

export default ConsoleFilters;
