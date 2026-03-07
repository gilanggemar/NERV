import { NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/telemetry/logger';
import { logAudit } from '@/lib/telemetry/logger';
import type { AuditEntry } from '@/lib/telemetry/types';

// GET /api/audit — paginated audit logs with filters
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');
        const agentId = searchParams.get('agentId') || undefined;
        const action = searchParams.get('action') || undefined;
        const from = searchParams.get('from');

        const result = await getAuditLogs({
            limit,
            offset,
            agentId,
            action,
            fromTimestamp: from ? parseInt(from) : undefined,
        });

        return NextResponse.json(result);
    } catch (error: unknown) {
        console.error('Failed to get audit logs:', error);
        return NextResponse.json({ error: 'Failed to get audit logs' }, { status: 500 });
    }
}

// POST /api/audit — log a new audit entry
export async function POST(request: Request) {
    try {
        const body: AuditEntry = await request.json();
        if (!body.agentId || !body.action) {
            return NextResponse.json({ error: 'agentId and action are required' }, { status: 400 });
        }
        await logAudit({ ...body, timestamp: body.timestamp || Date.now() });
        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error: unknown) {
        console.error('Failed to log audit entry:', error);
        return NextResponse.json({ error: 'Failed to log audit entry' }, { status: 500 });
    }
}
