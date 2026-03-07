import { NextResponse } from 'next/server';
import { deleteKnowledge } from '@/lib/memory/knowledge';
import { getAuthUserId } from '@/lib/auth';

// DELETE /api/memory/knowledge/[id] — delete a knowledge fragment
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    const { id } = await params;
    try {
        await deleteKnowledge(id);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Failed to delete knowledge:', error);
        return NextResponse.json({ error: 'Failed to delete knowledge' }, { status: 500 });
    }
}
