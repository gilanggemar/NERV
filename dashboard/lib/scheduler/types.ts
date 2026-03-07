// ─── Scheduler Types ─────────────────────────────────────────────────────────

export type ScheduledTaskStatus = 'enabled' | 'disabled';

export interface ScheduledTask {
    id: string;
    agentId: string;
    cronExpression: string;
    description: string;
    status: ScheduledTaskStatus;
    lastRunAt?: number;
    nextRunAt?: number;
    createdAt: number;
    updatedAt: number;
}

export interface WebhookConfig {
    id: string;
    source: string;           // 'github' | 'slack' | 'custom'
    agentId: string;
    eventFilter?: string;     // e.g., 'push', 'pull_request', '*'
    secret?: string;
    isActive: boolean;
    createdAt: number;
}

export const CRON_PRESETS: { label: string; cron: string }[] = [
    { label: 'Every morning at 9am', cron: '0 9 * * *' },
    { label: 'Every hour', cron: '0 * * * *' },
    { label: 'Every 30 minutes', cron: '*/30 * * * *' },
    { label: 'Every Monday at 10am', cron: '0 10 * * 1' },
    { label: 'Every weekday at 9am', cron: '0 9 * * 1-5' },
    { label: 'Every day at midnight', cron: '0 0 * * *' },
    { label: 'Every Sunday at 6pm', cron: '0 18 * * 0' },
];
