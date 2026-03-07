// ─── Notification & Alert Types ──────────────────────────────────────────────

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'alert';
export type NotificationChannel = 'dashboard' | 'webhook' | 'email';
export type AlertCondition = 'cost_exceeds' | 'error_rate_above' | 'latency_above' | 'agent_offline' | 'task_failed' | 'workflow_failed';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Notification {
    id: number;
    type: NotificationType;
    title: string;
    message: string;
    agentId?: string;
    isRead: boolean;
    actionUrl?: string;
    createdAt: number;
}

export interface AlertRule {
    id: string;
    name: string;
    condition: AlertCondition;
    threshold: number;
    severity: AlertSeverity;
    agentId?: string;            // null = all agents
    channels: NotificationChannel[];
    isActive: boolean;
    lastTriggeredAt?: number;
    cooldownMs: number;          // min time between alerts
    createdAt: number;
    updatedAt: number;
}

export const CONDITION_LABELS: Record<AlertCondition, { label: string; unit: string }> = {
    cost_exceeds: { label: 'Cost Exceeds', unit: '$' },
    error_rate_above: { label: 'Error Rate Above', unit: '%' },
    latency_above: { label: 'Latency Above', unit: 'ms' },
    agent_offline: { label: 'Agent Offline', unit: 'min' },
    task_failed: { label: 'Task Failed', unit: 'count' },
    workflow_failed: { label: 'Workflow Failed', unit: 'count' },
};

export const SEVERITY_COLORS: Record<AlertSeverity, string> = {
    low: 'text-blue-400',
    medium: 'text-amber-400',
    high: 'text-orange-400',
    critical: 'text-red-400',
};
