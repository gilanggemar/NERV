import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronRight, ChevronDown, CheckCircle2, Circle, ArrowRightCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import useAgentZeroStore from '@/store/useAgentZeroStore';

export interface AgentZeroResponse {
    thoughts?: string[];
    headline?: string;
    tool_name?: string;
    tool_args?: Record<string, any>;
    detail?: string;
}

const parseAgentZeroResponse = (content: any): AgentZeroResponse | null => {
    if (!content) return null;
    if (typeof content === 'object') {
        if (content.headline || content.tool_name || content.thoughts) {
            return content as AgentZeroResponse;
        }
    }
    if (typeof content === 'string') {
        try {
            let jsonString = content.trim();
            if (jsonString.startsWith('```')) {
                const lines = jsonString.split('\n');
                if (lines.length > 2) {
                    jsonString = lines.slice(1, -1).join('\n').trim();
                }
            }
            const parsed = JSON.parse(jsonString);
            if (parsed.headline || parsed.tool_name || parsed.thoughts) {
                return parsed as AgentZeroResponse;
            }
        } catch {
            return null;
        }
    }
    return null;
};

const isMemoryBlock = (content: any): boolean => {
    if (!content) return false;
    if (Array.isArray(content)) return true;
    if (typeof content === 'string') {
        let text = content.trim();
        if (text.startsWith('```')) {
            const lines = text.split('\n');
            if (lines.length > 2) {
                text = lines.slice(1, -1).join('\n').trim();
            }
        }
        return text.startsWith('[') && text.endsWith(']');
    }
    return false;
};

// Simple recursive node renderer
const TreeNode = ({ node, level = 0 }: { node: any; level?: number }) => {
    const [expanded, setExpanded] = React.useState(true);

    if (!node) return null;

    const hasChildren = (node.children && node.children.length > 0) || !!node.agentZeroData;

    const getStatusIcon = (status: number) => {
        // A0 Process Status: 0=pending, 1=running, 2=done, 3=error
        switch (status) {
            case 2: return <CheckCircle2 size={12} className="text-accent-lime shrink-0" />;
            case 1: return <ArrowRightCircle size={12} className="text-accent-cyan animate-pulse shrink-0" />;
            case 3: return <Circle size={12} className="text-destructive shrink-0" />;
            default: return <Circle size={12} className="text-muted-foreground shrink-0" />;
        }
    };

    return (
        <div className="flex flex-col w-full">
            <div
                className={cn(
                    "flex items-center gap-2 py-1.5 px-2 hover:bg-white/5 rounded-md cursor-pointer text-xs transition-colors",
                    level === 0 ? "font-medium" : "text-muted-foreground opacity-90"
                )}
                style={{ paddingLeft: `${(level * 12) + 8}px` }}
                onClick={() => setExpanded(!expanded)}
            >
                <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    {hasChildren ? (
                        expanded ? <ChevronDown size={14} className="opacity-50" /> : <ChevronRight size={14} className="opacity-50" />
                    ) : (
                        getStatusIcon(node.status)
                    )}
                </div>

                <span className="truncate flex-1">{node.name || 'Unnamed Task'}</span>
            </div>

            {expanded && (
                <div className="flex flex-col relative before:absolute before:inset-y-0 before:left-[15px] before:w-px before:bg-white/10">
                    {node.agentZeroData && (
                        <div className="flex flex-col gap-2.5 py-2 pr-2 text-xs" style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}>
                            {node.agentZeroData.tool_name && (
                                <div className="flex flex-col gap-1">
                                    <span className="text-muted-foreground opacity-70 uppercase text-[9px] tracking-wider font-medium">Item</span>
                                    <span className="font-mono text-[10px] text-[var(--accent-cyan)] bg-[var(--accent-cyan-ultra)] border border-[var(--accent-cyan-soft)] px-1.5 py-0.5 rounded-sm w-fit">
                                        {node.agentZeroData.tool_name}
                                    </span>
                                </div>
                            )}
                            {node.agentZeroData.detail && (
                                <div className="flex flex-col gap-1">
                                    <span className="text-muted-foreground opacity-70 uppercase text-[9px] tracking-wider font-medium">Detail</span>
                                    <span className="text-muted-foreground leading-snug">{node.agentZeroData.detail}</span>
                                </div>
                            )}
                            {node.agentZeroData.thoughts && node.agentZeroData.thoughts.length > 0 && (
                                <div className="flex flex-col gap-1">
                                    <span className="text-muted-foreground opacity-70 uppercase text-[9px] tracking-wider font-medium">Steps</span>
                                    <ul className="list-disc list-outside ml-3.5 flex flex-col gap-1 text-muted-foreground opacity-90">
                                        {node.agentZeroData.thoughts.map((t: string, i: number) => <li key={i} className="leading-snug">{t}</li>)}
                                    </ul>
                                </div>
                            )}
                            {node.agentZeroData.tool_args && Object.keys(node.agentZeroData.tool_args).length > 0 && (
                                <div className="flex flex-col gap-1">
                                    <span className="text-muted-foreground opacity-70 uppercase text-[9px] tracking-wider font-medium">Input</span>
                                    <div className="bg-black/40 p-2 rounded-md overflow-x-auto border border-white/5">
                                        <pre className="text-[10px] font-mono text-muted-foreground m-0">
                                            {JSON.stringify(node.agentZeroData.tool_args, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {node.children && node.children.length > 0 && node.children.map((child: any) => (
                        <TreeNode key={child.id} node={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

export const ProcessTree = ({ className }: { className?: string }) => {
    const { logs } = useAgentZeroStore();

    // Convert flat logs array to a simulated process list
    const getTree = () => {
        if (!logs || logs.length === 0) return [];

        const roots: any[] = [];
        let currentProcess: any = null;

        logs.forEach((log: any, index: number) => {
            const node: any = {
                id: `log-${index}`,
                status: 2, // assume done for past logs
                children: []
            };

            const parsedAz = parseAgentZeroResponse(log.content || log.message);
            const isMemory = isMemoryBlock(log.content || log.message);

            if (parsedAz) {
                node.name = parsedAz.headline || 'Process Detail';
                node.agentZeroData = parsedAz;
                node.status = 2; // Marked as done for JSON output
                roots.push(node);
                currentProcess = null; // New structured process
            } else if (isMemory) {
                node.name = 'Memory Database Updated';
                node.status = 2;
                if (currentProcess) {
                    currentProcess.children.push(node);
                    currentProcess.status = 2;
                } else {
                    roots.push(node);
                }
            } else if (log.type === 'thought') {
                node.name = `Thinking...`;
                node.status = 2;
                roots.push(node);
                currentProcess = null;
            } else if (log.type === 'tool_call' || log.type === 'execute') {
                node.name = `Executing: ${log.name || log.type}`;
                node.status = 1; // might be running
                roots.push(node);
                currentProcess = node;
            } else if (log.type === 'tool_result' || log.type === 'result') {
                if (currentProcess) {
                    node.name = 'Result Output';
                    currentProcess.children.push(node);
                    currentProcess.status = 2; // finish parent
                } else {
                    node.name = 'Result Output';
                    roots.push(node);
                }
            }
            // All other unformatted texts (including user chats and basic agent replies) 
            // are intentionally excluded to keep the Process Hierarchy clean.
        });

        // Ensure the last tool call is visually marked as running if we are still responding
        const isResponding = useAgentZeroStore.getState().isResponding;
        if (isResponding && roots.length > 0) {
            roots[roots.length - 1].status = 1;
        }

        return roots.reverse();
    };

    const treeData = getTree();

    return (
        <div className={cn("flex flex-col h-full overflow-hidden bg-black/20 rounded-md border border-white/5", className)}>
            <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-white/5 bg-white/[0.02]">
                <span className="text-xs font-medium opacity-80 uppercase tracking-widest text-[10px]">Process Hierarchy</span>
            </div>

            <ScrollArea className="flex-1 min-h-0 p-2">
                {treeData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-xs text-muted-foreground/50 p-4 text-center">
                        No active processes
                    </div>
                ) : (
                    <div className="flex flex-col gap-1 pb-4">
                        {treeData.map((rootNode) => (
                            <TreeNode key={rootNode.id} node={rootNode} />
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
};

