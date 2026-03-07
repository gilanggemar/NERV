import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

// POST /api/workflows/runs/[id]/cancel
export async function POST(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    const { id } = await params;
    try {
        await db.from('workflow_runs').update({
            status: 'cancelled',
            completed_at: new Date().toISOString(),
        }).eq('user_id', userId).eq('id', id);

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Failed to cancel workflow run:', error);
        return NextResponse.json({ error: 'Failed to cancel workflow run' }, { status: 500 });
    }
}
