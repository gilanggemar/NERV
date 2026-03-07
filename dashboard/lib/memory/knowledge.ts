// ─── Knowledge Fragment Management ──────────────────────────────────────────

import { db } from '@/lib/db';

/**
 * Store a knowledge fragment for an agent.
 */
export async function addKnowledge(
    agentId: string,
    content: string,
    source: string,
    tags: string[] = [],
    importance: number = 5
): Promise<string> {
    const id = crypto.randomUUID();
    await db.from('knowledge_fragments').insert({
        id,
        agent_id: agentId,
        content,
        source,
        tags, // jsonb — pass array directly
        importance,
    });
    return id;
}

/**
 * Search knowledge fragments by keyword (ILIKE for PostgreSQL).
 */
export async function searchKnowledge(
    agentId: string,
    query: string,
    limit: number = 20
) {
    const { data } = await db.from('knowledge_fragments')
        .select('*')
        .eq('agent_id', agentId)
        .ilike('content', `%${query}%`)
        .order('importance', { ascending: false })
        .limit(limit);

    return data || [];
}

/**
 * Get most recent knowledge fragments for an agent.
 */
export async function getRecentKnowledge(agentId: string, limit: number = 20) {
    const { data } = await db.from('knowledge_fragments')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(limit);

    return data || [];
}

/**
 * Delete a knowledge fragment.
 */
export async function deleteKnowledge(id: string): Promise<void> {
    await db.from('knowledge_fragments').delete().eq('id', id);
}
