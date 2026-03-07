import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// DELETE /api/workflows/runs/[id]
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await db.from('workflow_runs').delete().eq('id', id);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Failed to delete workflow run:', error);
        return NextResponse.json({ error: 'Failed to delete workflow run' }, { status: 500 });
    }
}
