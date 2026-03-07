// ─── Context Window Management ───────────────────────────────────────────────

import { db } from '@/lib/db';
import type { Message, ContextWindow } from './types';

/**
 * Estimate token count for text (~4 chars per token, matches GPT-class models).
 */
export function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

/**
 * Prune messages to fit within a token budget, keeping the most recent.
 * Always preserves the system message if present.
 */
export function pruneContext(messages: Message[], maxTokens: number): Message[] {
    // Separate system messages (always keep)
    const systemMsgs = messages.filter((m) => m.role === 'system');
    const otherMsgs = messages.filter((m) => m.role !== 'system');

    let budget = maxTokens;
    const result: Message[] = [];

    // Reserve budget for system messages
    for (const msg of systemMsgs) {
        budget -= msg.tokenCount;
        result.push(msg);
    }

    // Fill from newest to oldest
    for (let i = otherMsgs.length - 1; i >= 0; i--) {
        if (budget - otherMsgs[i].tokenCount < 0) break;
        budget -= otherMsgs[i].tokenCount;
        result.push(otherMsgs[i]);
    }

    // Re-sort chronologically
    return result.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Build a context window for an agent from recent conversation + relevant knowledge.
 */
export async function buildContext(
    conversationId: string,
    maxTokens: number = 8192,
    agentId?: string
): Promise<ContextWindow> {
    // Fetch all messages in current conversation
    const { data: rawMessages } = await db.from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    const messages: Message[] = (rawMessages || []).map((m: any) => ({
        id: m.id!,
        conversationId: m.conversation_id,
        role: m.role as Message['role'],
        content: m.content,
        tokenCount: m.token_count || estimateTokens(m.content),
        timestamp: new Date(m.created_at).getTime(),
    }));

    // Fetch relevant knowledge fragments
    const knowledgeContext: string[] = [];
    let knowledgeBudget = Math.floor(maxTokens * 0.15); // Reserve 15% for knowledge

    if (agentId) {
        const { data: fragments } = await db.from('knowledge_fragments')
            .select('*')
            .eq('agent_id', agentId)
            .order('importance', { ascending: false })
            .limit(20);

        for (const frag of (fragments || [])) {
            const tokens = estimateTokens(frag.content);
            if (knowledgeBudget - tokens < 0) break;
            knowledgeBudget -= tokens;
            knowledgeContext.push(frag.content);
        }
    }

    // Prune messages to fit remaining budget
    const messageBudget = maxTokens - (Math.floor(maxTokens * 0.15) - knowledgeBudget);
    const prunedMessages = pruneContext(messages, messageBudget);

    const usedTokens = prunedMessages.reduce((sum, m) => sum + m.tokenCount, 0)
        + knowledgeContext.reduce((sum, k) => sum + estimateTokens(k), 0);

    return {
        maxTokens,
        usedTokens,
        messages: prunedMessages,
        knowledgeContext,
    };
}
