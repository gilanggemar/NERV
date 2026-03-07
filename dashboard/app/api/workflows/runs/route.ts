import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/workflows/runs — list run history
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const workflowId = searchParams.get('workflowId');
        const limit = parseInt(searchParams.get('limit') || '50');

        let query = db.from('workflow_runs').select('*').order('started_at', { ascending: false }).limit(limit);
        if (workflowId) query = query.eq('workflow_id', workflowId);

        const { data: rows, error } = await query;
        if (error) throw new Error(error.message);
        // step_results is already parsed (jsonb)
        return NextResponse.json(rows);
    } catch (error: unknown) {
        console.error('Failed to list workflow runs:', error);
        return NextResponse.json({ error: 'Failed to list runs' }, { status: 500 });
    }
}
