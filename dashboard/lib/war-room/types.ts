// ─── War Room Types ────────────────────────────────────────────────────────────

export type WarRoomSessionStatus = 'active' | 'resolved';
export type WarRoomEventType = 'position_update' | 'agreement' | 'override' | 'system' | 'message';

export interface WarRoomSession {
    id: string;
    topic: string;
    status: WarRoomSessionStatus;
    decision?: string;
    actionItems: string[];
    linkedTasks: string[];
    startedAt: number;
    endedAt?: number;
    updatedAt: number;
    consensus_score?: number;
}

export interface WarRoomEvent {
    id: string;
    sessionId: string;
    type: WarRoomEventType;
    agentId?: string;       // the agent executing the action (or undefined for system/human)
    content: string;        // message, position statement, or directive
    metadata: Record<string, unknown>; // graph coords, link targets, sentiment
    timestamp: number;
}

export interface AgentPosition {
    agentId: string;
    x: number;
    y: number;
    sentiment: number;      // -1 (strongly disagree) to +1 (strongly agree) relative to topic
    stance: string;         // Summary of current position
}

export interface GraphLink {
    source: string;
    target: string;
    weight: number;         // -1 to 1 representing agreement/disagreement
}
