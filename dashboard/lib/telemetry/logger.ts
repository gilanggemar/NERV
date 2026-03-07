// ─── Telemetry Logger ────────────────────────────────────────────────────────
//
// Server-side functions for writing telemetry and audit entries to Supabase.

import { db } from '@/lib/db';
import { calculateCost } from './costs';
import type { TelemetryEntry, AuditEntry, TelemetrySummary, ChartDataPoint, AgentTelemetrySummary } from './types';

/** Insert a telemetry log entry */
export async function logTelemetry(entry: TelemetryEntry): Promise<void> {
    // Calculate cost if not provided
    const costUsd = entry.costUsd
        ? parseFloat(entry.costUsd)
        : calculateCost(entry.model || 'unknown', entry.inputTokens || 0, entry.outputTokens || 0);

    await db.from('telemetry_logs').insert({
        agent_id: entry.agentId,
        provider: entry.provider || null,
        model: entry.model || null,
        input_tokens: entry.inputTokens || 0,
        output_tokens: entry.outputTokens || 0,
        cost_usd: costUsd,
        latency_ms: entry.latencyMs || 0,
        status: entry.status,
        session_id: entry.taskId || null,
        // created_at uses defaultNow() in Supabase
    });
}

/** Insert an audit log entry */
export async function logAudit(entry: AuditEntry): Promise<void> {
    await db.from('audit_logs').insert({
        agent_id: entry.agentId,
        action: entry.action,
        details: entry.details || null,
        diff_payload: entry.diffPayload || null,
        session_id: entry.sessionId || null,
        summit_id: entry.summitId || null,
        // created_at uses defaultNow() in Supabase
    });
}

/** Get aggregated telemetry summary for dashboard */
export async function getTelemetrySummary(): Promise<TelemetrySummary> {
    const now = Date.now();
    const todayStart = new Date(now - (24 * 60 * 60 * 1000)).toISOString();
    const weekStart = new Date(now - (7 * 24 * 60 * 60 * 1000)).toISOString();
    const monthStart = new Date(now - (30 * 24 * 60 * 60 * 1000)).toISOString();

    // Total spend calculations
    const { data: spendRows } = await db.from('telemetry_logs')
        .select('cost_usd, created_at, agent_id')
        .gte('created_at', monthStart);

    let totalSpendToday = 0;
    let totalSpendWeek = 0;
    let totalSpendMonth = 0;
    const costByAgent: Record<string, number> = {};

    for (const row of (spendRows || [])) {
        const cost = row.cost_usd || 0;
        const rowDate = row.created_at;
        totalSpendMonth += cost;
        if (rowDate >= weekStart) totalSpendWeek += cost;
        if (rowDate >= todayStart) totalSpendToday += cost;
        if (row.agent_id) {
            costByAgent[row.agent_id] = (costByAgent[row.agent_id] || 0) + cost;
        }
    }

    // Today's tokens
    const { data: tokenRows } = await db.from('telemetry_logs')
        .select('input_tokens, output_tokens')
        .gte('created_at', todayStart);

    let todayInputTokens = 0;
    let todayOutputTokens = 0;
    for (const row of (tokenRows || [])) {
        todayInputTokens += row.input_tokens || 0;
        todayOutputTokens += row.output_tokens || 0;
    }

    // Latency by provider
    const { data: latencyRows } = await db.from('telemetry_logs')
        .select('provider, latency_ms')
        .gte('created_at', weekStart)
        .eq('status', 'success');

    const latencySums: Record<string, { total: number; count: number }> = {};
    for (const row of (latencyRows || [])) {
        if (!row.provider || !row.latency_ms) continue;
        if (!latencySums[row.provider]) latencySums[row.provider] = { total: 0, count: 0 };
        latencySums[row.provider].total += row.latency_ms;
        latencySums[row.provider].count += 1;
    }
    const latencyByProvider: Record<string, number> = {};
    for (const [p, s] of Object.entries(latencySums)) {
        latencyByProvider[p] = Math.round(s.total / s.count);
    }

    // Error rate by agent
    const { data: errorRows } = await db.from('telemetry_logs')
        .select('agent_id, status')
        .gte('created_at', weekStart);

    const agentCounts: Record<string, { total: number; errors: number }> = {};
    for (const row of (errorRows || [])) {
        if (!row.agent_id) continue;
        if (!agentCounts[row.agent_id]) agentCounts[row.agent_id] = { total: 0, errors: 0 };
        agentCounts[row.agent_id].total += 1;
        if (row.status === 'error') agentCounts[row.agent_id].errors += 1;
    }
    const errorRateByAgent: Record<string, number> = {};
    for (const [a, c] of Object.entries(agentCounts)) {
        errorRateByAgent[a] = c.total > 0 ? Math.round((c.errors / c.total) * 100) : 0;
    }

    return {
        totalSpendToday,
        totalSpendWeek,
        totalSpendMonth,
        totalTokensToday: { input: todayInputTokens, output: todayOutputTokens },
        costByAgent,
        latencyByProvider,
        errorRateByAgent,
    };
}

/** Get per-agent telemetry summary for AgentStatBlock */
export async function getAgentTelemetrySummary(agentId: string): Promise<AgentTelemetrySummary> {
    const now = Date.now();
    const monthStart = new Date(now - (30 * 24 * 60 * 60 * 1000)).toISOString();

    const { data: rows } = await db.from('telemetry_logs')
        .select('input_tokens, output_tokens, cost_usd, latency_ms, status')
        .eq('agent_id', agentId)
        .gte('created_at', monthStart);

    if (!rows || rows.length === 0) {
        return { successRate: 0, avgLatency: 0, totalOps: 0, totalTokens: 0, monthlyCost: 0 };
    }

    let totalOps = rows.length;
    let successCount = 0;
    let totalLatency = 0;
    let latencyCount = 0;
    let totalTokens = 0;
    let monthlyCost = 0;

    for (const row of rows) {
        if (row.status === 'success') successCount++;
        if (row.latency_ms) {
            totalLatency += row.latency_ms;
            latencyCount++;
        }
        totalTokens += (row.input_tokens || 0) + (row.output_tokens || 0);
        monthlyCost += row.cost_usd || 0;
    }

    return {
        successRate: totalOps > 0 ? Math.round((successCount / totalOps) * 100 * 10) / 10 : 0,
        avgLatency: latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0,
        totalOps,
        totalTokens,
        monthlyCost: Math.round(monthlyCost * 100) / 100,
    };
}

/** Get time-series chart data for a date range */
export async function getChartData(fromTimestamp: number, toTimestamp: number): Promise<ChartDataPoint[]> {
    const fromDate = new Date(fromTimestamp).toISOString();
    const toDate = new Date(toTimestamp).toISOString();

    const { data: rows } = await db.from('telemetry_logs')
        .select('created_at, input_tokens, output_tokens, cost_usd')
        .gte('created_at', fromDate)
        .lte('created_at', toDate)
        .order('created_at', { ascending: true });

    // Group by hour
    const buckets: Record<string, ChartDataPoint> = {};
    for (const row of (rows || [])) {
        const date = new Date(row.created_at);
        const hourKey = `${date.toISOString().slice(0, 13)}:00`;
        if (!buckets[hourKey]) {
            buckets[hourKey] = {
                timestamp: new Date(hourKey).getTime(),
                date: hourKey,
                inputTokens: 0,
                outputTokens: 0,
                cost: 0,
            };
        }
        buckets[hourKey].inputTokens += row.input_tokens || 0;
        buckets[hourKey].outputTokens += row.output_tokens || 0;
        buckets[hourKey].cost += row.cost_usd || 0;
    }

    return Object.values(buckets).sort((a, b) => a.timestamp - b.timestamp);
}

/** Get paginated audit logs */
export async function getAuditLogs(options: {
    limit?: number;
    offset?: number;
    agentId?: string;
    action?: string;
    fromTimestamp?: number;
}) {
    const { limit = 50, offset = 0, agentId, action, fromTimestamp } = options;

    let query = db.from('audit_logs').select('*', { count: 'exact' });
    if (agentId) query = query.eq('agent_id', agentId);
    if (action) query = query.eq('action', action);
    if (fromTimestamp) query = query.gte('created_at', new Date(fromTimestamp).toISOString());

    const { data: rows, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    return { rows: rows || [], total: count || 0 };
}
