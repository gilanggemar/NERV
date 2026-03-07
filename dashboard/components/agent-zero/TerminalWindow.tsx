import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import useAgentZeroStore from '@/store/useAgentZeroStore';

export const TerminalWindow = ({ className }: { className?: string }) => {
    const { logs } = useAgentZeroStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    const getTerminalLines = () => {
        const lines: string[] = [];

        if (logs && logs.length > 0) {
            logs.forEach(log => {
                if (log.content) {
                    if (typeof log.content === 'string') {
                        lines.push(log.content);
                    } else {
                        try {
                            lines.push(JSON.stringify(log.content, null, 2));
                        } catch (e) {
                            lines.push(String(log.content));
                        }
                    }
                } else if (log.message) {
                    lines.push(String(log.message));
                }
            });
        }

        return lines;
    };

    const terminalLines = getTerminalLines();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [terminalLines]);

    return (
        <div className={cn("flex flex-col h-full bg-black/80 rounded-md border border-white/10 font-mono text-xs overflow-hidden", className)}>
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/10 bg-white/5">
                <Terminal size={12} className="text-muted-foreground" />
                <span className="text-muted-foreground uppercase opacity-70 tracking-widest text-[10px]">Console Output</span>
                {terminalLines.length > 0 && <div className="ml-auto w-2 h-2 rounded-full bg-accent-lime animate-pulse" />}
            </div>

            <ScrollArea className="flex-1 p-3 text-green-400">
                <div className="flex flex-col gap-1">
                    {terminalLines.length === 0 ? (
                        <div className="text-green-400/30">Waiting for stream...</div>
                    ) : (
                        terminalLines.map((line, i) => (
                            <div key={i} className="whitespace-pre-wrap break-all leading-relaxed opacity-90">
                                {line}
                            </div>
                        ))
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>
        </div>
    );
};
