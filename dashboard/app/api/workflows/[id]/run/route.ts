import { NextResponse } from 'next/server';
import { createWorkflowRun } from '@/lib/workflows/engine';

// POST /api/workflows/[id]/run — trigger a workflow execution
export async function POST(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const runId = await createWorkflowRun(id, 'manual');
        return NextResponse.json({ runId }, { status: 201 });
    } catch (error: unknown) {
        console.error('Failed to trigger workflow run:', error);
        const message = error instanceof Error ? error.message : 'Failed to trigger run';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
