import { NextResponse } from 'next/server';
import { getTelemetrySummary, getAgentTelemetrySummary, logTelemetry } from '@/lib/telemetry/logger';
import type { TelemetryEntry } from '@/lib/telemetry/types';
import { getAuthUserId } from '@/lib/auth';

// GET /api/telemetry — get summary stats (global or per-agent)
export async function GET(request: Request) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const { searchParams } = new URL(request.url);
        const agentId = searchParams.get('agentId');

        // If agentId is provided, return per-agent summary
        if (agentId) {
            const agentSummary = await getAgentTelemetrySummary(agentId);
            return NextResponse.json(agentSummary);
        }

        // Otherwise return global summary
        const summary = await getTelemetrySummary();
        return NextResponse.json(summary);
    } catch (error: unknown) {
        console.error('Failed to get telemetry summary:', error);
        return NextResponse.json({ error: 'Failed to get telemetry' }, { status: 500 });
    }
}

// POST /api/telemetry — log a new telemetry entry
export async function POST(request: Request) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const body: TelemetryEntry = await request.json();
        if (!body.agentId || !body.status) {
            return NextResponse.json({ error: 'agentId and status are required' }, { status: 400 });
        }
        await logTelemetry({ ...body, timestamp: body.timestamp || Date.now() });
        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error: unknown) {
        console.error('Failed to log telemetry:', error);
        return NextResponse.json({ error: 'Failed to log telemetry' }, { status: 500 });
    }
}
