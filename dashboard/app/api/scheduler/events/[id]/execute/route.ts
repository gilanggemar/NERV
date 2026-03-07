import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── POST: Manually execute a scheduler event ──────────────────────────────

export async function POST(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const { data: event, error } = await db.from('scheduler_events').select('*').eq('id', id).single();

        if (error || !event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        const now = Math.floor(Date.now() / 1000);

        // Update event: status → running, increment runCount, set lastRunAt
        await db.from('scheduler_events').update({
            status: 'in_progress',
            run_count: (event.run_count || 0) + 1,
            last_run_at: now,
            updated_at: new Date().toISOString(),
        }).eq('id', id);

        // If linked to a task, update task status to IN_PROGRESS
        if (event.task_id) {
            await db.from('tasks').update({
                status: 'IN_PROGRESS',
            }).eq('id', event.task_id);
        }

        // Emit audit log
        await db.from('audit_logs').insert({
            agent_id: event.agent_id,
            action: 'scheduler_event_executed',
            details: JSON.stringify({
                eventId: event.id,
                title: event.title,
                taskId: event.task_id,
                runCount: (event.run_count || 0) + 1,
            }),
        });

        return NextResponse.json({
            success: true,
            runCount: (event.run_count || 0) + 1,
        });
    } catch (error: unknown) {
        console.error('POST /api/scheduler/events/[id]/execute error:', error);
        return NextResponse.json({ error: 'Failed to execute event' }, { status: 500 });
    }
}
