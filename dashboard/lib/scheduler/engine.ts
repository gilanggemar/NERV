// ─── Scheduler Engine ────────────────────────────────────────────────────────

import { db } from '@/lib/db';
import type { ScheduledTask, WebhookConfig } from './types';

// ─── Scheduled Tasks CRUD ────────────────────────────────────────────────────

export async function createScheduledTask(
    agentId: string, cronExpression: string, description: string
): Promise<string> {
    const id = crypto.randomUUID();
    await db.from('scheduled_tasks').insert({
        id, agent_id: agentId, cron_expression: cronExpression, description,
        status: 'enabled',
    });
    return id;
}

export async function getScheduledTasks() {
    const { data } = await db.from('scheduled_tasks').select('*').order('created_at', { ascending: false });
    return data || [];
}

export async function updateScheduledTask(id: string, updates: Partial<ScheduledTask>): Promise<void> {
    const set: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.cronExpression !== undefined) set.cron_expression = updates.cronExpression;
    if (updates.description !== undefined) set.description = updates.description;
    if (updates.status !== undefined) set.status = updates.status;
    if (updates.agentId !== undefined) set.agent_id = updates.agentId;
    if (updates.lastRunAt !== undefined) set.last_run_at = updates.lastRunAt;
    if (updates.nextRunAt !== undefined) set.next_run_at = updates.nextRunAt;
    await db.from('scheduled_tasks').update(set).eq('id', id);
}

export async function deleteScheduledTask(id: string): Promise<void> {
    await db.from('scheduled_tasks').delete().eq('id', id);
}

// ─── Webhook Configs CRUD ────────────────────────────────────────────────────

export async function createWebhookConfig(
    source: string, agentId: string, eventFilter?: string, secret?: string
): Promise<string> {
    const id = crypto.randomUUID();
    await db.from('webhook_configs').insert({
        id, source, agent_id: agentId,
        event_filter: eventFilter || '*',
        secret: secret || null,
        is_active: true,
    });
    return id;
}

export async function getWebhookConfigs() {
    const { data } = await db.from('webhook_configs').select('*').order('created_at', { ascending: false });
    return data || [];
}

export async function deleteWebhookConfig(id: string): Promise<void> {
    await db.from('webhook_configs').delete().eq('id', id);
}
