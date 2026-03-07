// ─── War Room Engine ───────────────────────────────────────────────────────────

import { db } from '@/lib/db';
import type { WarRoomSession, WarRoomEvent, WarRoomSessionStatus, WarRoomEventType } from './types';

// ─── Sessions ────────────────────────────────────────────────────────────────

export async function createWarRoomSession(topic: string): Promise<string> {
    const id = crypto.randomUUID();

    await db.from('war_room_sessions').insert({
        id, topic, status: 'active',
        action_items: [], linked_tasks: [],
    });

    // Add initial system event
    await addWarRoomEvent(id, 'system', `War Room activated. Topic: ${topic}`, {}, undefined);

    return id;
}

export async function getWarRoomSessions(): Promise<WarRoomSession[]> {
    const { data: rows } = await db.from('war_room_sessions').select('*').order('started_at', { ascending: false });
    return (rows || []).map((row: any) => ({
        ...row,
        status: row.status as WarRoomSessionStatus,
        actionItems: row.action_items || [],
        linkedTasks: row.linked_tasks || [],
        decision: row.decision ?? undefined,
        endedAt: row.ended_at ?? undefined,
    }));
}

export async function getWarRoomSession(id: string): Promise<WarRoomSession | null> {
    const { data: row } = await db.from('war_room_sessions').select('*').eq('id', id).single();
    if (!row) return null;
    return {
        ...row,
        status: row.status as WarRoomSessionStatus,
        actionItems: row.action_items || [],
        linkedTasks: row.linked_tasks || [],
        decision: row.decision ?? undefined,
        endedAt: row.ended_at ?? undefined,
    };
}

export async function resolveWarRoomSession(id: string, decision: string, actionItems: string[]): Promise<void> {
    await db.from('war_room_sessions').update({
        status: 'resolved',
        decision,
        action_items: actionItems, // jsonb
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }).eq('id', id);

    await addWarRoomEvent(id, 'system', `Consensus reached: ${decision}`, { actionItems }, undefined);
}

// ─── Events ──────────────────────────────────────────────────────────────────

export async function addWarRoomEvent(
    sessionId: string,
    type: WarRoomEventType,
    content: string,
    metadata: Record<string, unknown> = {},
    agentId?: string
): Promise<WarRoomEvent> {
    const id = crypto.randomUUID();

    const eventRow = {
        id, session_id: sessionId, type, content,
        metadata, // jsonb
        agent_id: agentId || null,
    };

    await db.from('war_room_events').insert(eventRow);
    await db.from('war_room_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId);

    return {
        id,
        sessionId,
        type,
        content,
        metadata,
        agentId: agentId ?? undefined,
        timestamp: Date.now(),
    };
}

export async function getWarRoomEvents(sessionId: string): Promise<WarRoomEvent[]> {
    const { data: rows } = await db.from('war_room_events')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

    return (rows || []).map((row: any) => ({
        ...row,
        sessionId: row.session_id,
        type: row.type as WarRoomEventType,
        agentId: row.agent_id ?? undefined,
        metadata: row.metadata || {},
        timestamp: new Date(row.created_at).getTime(),
    }));
}
