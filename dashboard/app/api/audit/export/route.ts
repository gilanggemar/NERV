import { NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/telemetry/logger';
import { getAuthUserId } from '@/lib/auth';

// GET /api/audit/export — export audit logs as JSON or CSV
export async function GET(request: Request) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format') || 'json';
        const agentId = searchParams.get('agentId') || undefined;
        const action = searchParams.get('action') || undefined;

        const { rows } = await getAuditLogs({ limit: 10000, offset: 0, agentId, action });

        if (format === 'csv') {
            const headers = ['id', 'timestamp', 'agentId', 'action', 'details', 'sessionId', 'summitId'];
            const csvLines = [headers.join(',')];
            for (const row of rows) {
                csvLines.push([
                    row.id,
                    new Date(row.timestamp).toISOString(),
                    row.agentId,
                    row.action,
                    `"${(row.details || '').replace(/"/g, '""')}"`,
                    row.sessionId || '',
                    row.summitId || '',
                ].join(','));
            }
            return new Response(csvLines.join('\n'), {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="audit_logs_${Date.now()}.csv"`,
                },
            });
        }

        // Default: JSON
        return new Response(JSON.stringify(rows, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="audit_logs_${Date.now()}.json"`,
            },
        });
    } catch (error: unknown) {
        console.error('Failed to export audit logs:', error);
        return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
    }
}
