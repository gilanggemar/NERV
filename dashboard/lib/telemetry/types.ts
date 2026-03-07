// ─── Telemetry & Audit Type Definitions ──────────────────────────────────────

export interface TelemetryEntry {
    id?: number;
    timestamp: number;
    agentId: string;
    provider?: string;
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    costUsd?: string;
    latencyMs?: number;
    status: 'success' | 'error';
    taskId?: string;
    errorMessage?: string;
}

export interface AuditEntry {
    id?: number;
    timestamp: number;
    agentId: string;
    action: string;       // e.g., 'task.started', 'file.created', 'file.modified', 'command.executed', 'summit.joined', 'consensus.reached'
    details?: string;     // JSON payload
    diffPayload?: string; // code diff for file changes
    sessionId?: string;
    summitId?: string;
}

export type AuditAction =
    | 'task.started'
    | 'task.completed'
    | 'task.failed'
    | 'file.created'
    | 'file.modified'
    | 'file.deleted'
    | 'command.executed'
    | 'summit.joined'
    | 'summit.left'
    | 'consensus.reached'
    | 'message.sent'
    | 'tool.called'
    | 'tool.completed'
    | 'error.occurred';

export interface TelemetrySummary {
    totalSpendToday: number;
    totalSpendWeek: number;
    totalSpendMonth: number;
    totalTokensToday: { input: number; output: number };
    costByAgent: Record<string, number>;
    latencyByProvider: Record<string, number>;
    errorRateByAgent: Record<string, number>;
}

export interface ChartDataPoint {
    timestamp: number;
    date: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
}

/** Per-agent telemetry summary for the AgentStatBlock component */
export interface AgentTelemetrySummary {
    successRate: number;       // Percentage 0-100
    avgLatency: number;        // Average latency in ms
    totalOps: number;          // Total operations count
    totalTokens: number;       // Input + output tokens combined
    monthlyCost: number;       // Cost in USD for current month
}
