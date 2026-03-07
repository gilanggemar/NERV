// ─── Agent Memory & Context Types ────────────────────────────────────────────

export interface Conversation {
    id: string;
    agentId: string;
    title: string;
    messageCount: number;
    createdAt: number;
    updatedAt: number;
}

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface Message {
    id: number;
    conversationId: string;
    role: MessageRole;
    content: string;
    tokenCount: number;
    timestamp: number;
}

export interface KnowledgeFragment {
    id: string;
    agentId: string;
    content: string;
    source: string;        // e.g., 'chat', 'summit', 'file', 'manual'
    tags: string[];
    importance: number;    // 1-10
    createdAt: number;
}

export interface ContextWindow {
    maxTokens: number;
    usedTokens: number;
    messages: Message[];
    knowledgeContext: string[];
}

export interface MemorySummary {
    agentId: string;
    conversationCount: number;
    totalMessages: number;
    knowledgeCount: number;
    estimatedTokens: number;
}
