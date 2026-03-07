// ─── NERV GRAPH — Shared Node Style Constants ──────────────────────────────

import React from 'react';
import type { WfNodeExecStatus } from '@/store/useWorkflowBuilderStore';

export const NODE_ACCENTS = {
    trigger: 'var(--accent-lime)',
    agent: 'var(--accent-base)',
    prompt: 'var(--accent-violet)',
    tool: 'var(--accent-teal)',
    condition: 'var(--accent-coral)',
    transform: 'var(--accent-ocean)',
    output: 'var(--accent-base)',
    loop: 'var(--accent-teal)',
    delay: 'var(--text-muted)',
    summit: 'var(--accent-violet)',
    group: 'var(--accent-ocean)',
} as const;

export type WfNodeType = keyof typeof NODE_ACCENTS;

export const EXEC_STATUS_COLORS: Record<WfNodeExecStatus, string> = {
    idle: 'var(--text-muted)',
    queued: 'var(--accent-base)',
    running: 'var(--accent-base)',
    success: 'var(--status-online)',
    error: 'var(--status-error)',
};

export const NODE_DIMENSIONS = {
    minWidth: 200,
    padding: 12,
    borderRadius: 14,
    handleSize: 10,
} as const;

export const HANDLE_BASE_STYLE: React.CSSProperties = {
    width: NODE_DIMENSIONS.handleSize,
    height: NODE_DIMENSIONS.handleSize,
    border: '2px solid oklch(1 0 0 / 0.15)',
    borderRadius: '50%',
    transition: 'all 150ms ease',
};

export function getHandleStyle(accent: string): React.CSSProperties {
    return {
        ...HANDLE_BASE_STYLE,
        background: accent,
        boxShadow: `0 0 6px ${accent}`,
    };
}

export interface NodeCategoryDef {
    id: string;
    label: string;
    accent: string;
    items: NodePaletteItem[];
}

export interface NodePaletteItem {
    type: WfNodeType;
    label: string;
    icon: string;
    description?: string;
    defaultData?: Record<string, unknown>;
}

export const NODE_CATEGORIES: NodeCategoryDef[] = [
    {
        id: 'triggers',
        label: 'Triggers',
        accent: NODE_ACCENTS.trigger,
        items: [
            { type: 'trigger', label: 'Manual', icon: 'Zap', description: 'Click to run', defaultData: { triggerType: 'Manual', label: 'Manual Trigger' } },
            { type: 'trigger', label: 'Schedule', icon: 'Clock', description: 'Cron / interval', defaultData: { triggerType: 'Schedule', label: 'Schedule Trigger' } },
            { type: 'trigger', label: 'Webhook', icon: 'Globe', description: 'HTTP endpoint', defaultData: { triggerType: 'Webhook', label: 'Webhook Trigger' } },
            { type: 'trigger', label: 'Event', icon: 'Radio', description: 'System event', defaultData: { triggerType: 'Event', label: 'Event Trigger' } },
        ],
    },
    {
        id: 'agents',
        label: 'Agents',
        accent: NODE_ACCENTS.agent,
        items: [
            { type: 'agent', label: 'Agent', icon: 'Bot', description: 'Route to agent' },
        ],
    },
    {
        id: 'logic',
        label: 'Logic',
        accent: NODE_ACCENTS.condition,
        items: [
            { type: 'condition', label: 'Condition', icon: 'GitBranch', description: 'If/else branch' },
            { type: 'delay', label: 'Delay', icon: 'Timer', description: 'Wait timer' },
        ],
    },
    {
        id: 'processing',
        label: 'Processing',
        accent: NODE_ACCENTS.prompt,
        items: [
            { type: 'prompt', label: 'Prompt', icon: 'MessageSquare', description: 'Template' },
            { type: 'transform', label: 'Transform', icon: 'Code', description: 'Code block' },
            { type: 'tool', label: 'MCP Tool', icon: 'Wrench', description: 'Call MCP' },
        ],
    },
    {
        id: 'output',
        label: 'Output',
        accent: NODE_ACCENTS.output,
        items: [
            { type: 'output', label: 'Output', icon: 'Flag', description: 'Send result' },
        ],
    },
    {
        id: 'special',
        label: 'Special',
        accent: NODE_ACCENTS.summit,
        items: [
            { type: 'summit', label: 'Summit', icon: 'Users', description: 'Multi-agent' },
            { type: 'group', label: 'Group', icon: 'Box', description: 'Container' },
        ],
    },
];
