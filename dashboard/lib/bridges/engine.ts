// ─── Platform Bridges Engine ─────────────────────────────────────────────────

import { db } from '@/lib/db';
import type { BridgeConfig, PlatformType, BridgeStatus } from './types';

export async function createBridge(
    platform: PlatformType, name: string, apiKey?: string, webhookUrl?: string
): Promise<string> {
    const id = crypto.randomUUID();
    await db.from('platform_bridges').insert({
        id, platform, name, api_key: apiKey || null, webhook_url: webhookUrl || null,
        status: 'disconnected', settings: {}, assigned_agents: [],
    });
    return id;
}

export async function getBridges(): Promise<BridgeConfig[]> {
    const { data } = await db.from('platform_bridges').select('*').order('created_at', { ascending: false });
    return (data || []).map((row: any) => ({
        ...row,
        platform: row.platform as PlatformType,
        status: row.status as BridgeStatus,
        settings: row.settings || {},
        assignedAgents: row.assigned_agents || [],
        apiKey: row.api_key ?? undefined,
        webhookUrl: row.webhook_url ?? undefined,
        lastSyncedAt: row.last_synced_at ?? undefined,
    }));
}

export async function updateBridge(id: string, updates: Partial<BridgeConfig>): Promise<void> {
    const set: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) set.name = updates.name;
    if (updates.apiKey !== undefined) set.api_key = updates.apiKey;
    if (updates.webhookUrl !== undefined) set.webhook_url = updates.webhookUrl;
    if (updates.status !== undefined) set.status = updates.status;
    if (updates.settings !== undefined) set.settings = updates.settings; // jsonb
    if (updates.assignedAgents !== undefined) set.assigned_agents = updates.assignedAgents; // jsonb
    if (updates.lastSyncedAt !== undefined) set.last_synced_at = updates.lastSyncedAt;
    await db.from('platform_bridges').update(set).eq('id', id);
}

export async function deleteBridge(id: string): Promise<void> {
    await db.from('platform_bridges').delete().eq('id', id);
}

export async function toggleAgentAssigned(id: string, agentId: string): Promise<void> {
    const { data: bridge } = await db.from('platform_bridges').select('assigned_agents').eq('id', id).single();
    if (!bridge) return;
    const agents = (bridge.assigned_agents || []) as string[];
    const newAgents = agents.includes(agentId) ? agents.filter((a: string) => a !== agentId) : [...agents, agentId];
    await updateBridge(id, { assignedAgents: newAgents });
}
