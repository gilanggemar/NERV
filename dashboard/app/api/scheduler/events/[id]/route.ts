import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseISO } from 'date-fns';

// ─── GET: Single event by ID ────────────────────────────────────────────────

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const { data: event, error } = await db.from('scheduler_events').select('*').eq('id', id).single();
        if (error || !event) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
        return NextResponse.json(event);
    } catch (error: unknown) {
        console.error('GET /api/scheduler/events/[id] error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// ─── PUT: Update event ──────────────────────────────────────────────────────

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();

        // Build update set with snake_case column names
        const updateSet: Record<string, unknown> = { updated_at: new Date().toISOString() };

        const fieldMap: Record<string, string> = {
            taskId: 'task_id',
            agentId: 'agent_id',
            title: 'title',
            description: 'description',
            scheduledDate: 'scheduled_date',
            scheduledTime: 'scheduled_time',
            durationMinutes: 'duration_minutes',
            recurrenceType: 'recurrence_type',
            recurrenceInterval: 'recurrence_interval',
            recurrenceEndDate: 'recurrence_end_date',
            status: 'status',
            color: 'color',
            priority: 'priority',
        };

        for (const [bodyKey, dbKey] of Object.entries(fieldMap)) {
            if (body[bodyKey] !== undefined) {
                updateSet[dbKey] = body[bodyKey];
            }
        }

        // Handle recurrenceDaysOfWeek (convert array to JSON string)
        if (body.recurrenceDaysOfWeek !== undefined) {
            updateSet.recurrence_days_of_week = body.recurrenceDaysOfWeek
                ? JSON.stringify(body.recurrenceDaysOfWeek) : null;
        }

        // Recompute nextRunAt if schedule changed
        const scheduledDate = body.scheduledDate;
        const scheduledTime = body.scheduledTime;
        if (scheduledDate !== undefined || scheduledTime !== undefined) {
            const { data: existing } = await db.from('scheduler_events').select('*').eq('id', id).single();
            if (existing) {
                const dateStr = scheduledDate || existing.scheduled_date;
                const timeStr = scheduledTime !== undefined ? scheduledTime : existing.scheduled_time;
                const dt = parseISO(`${dateStr}T${timeStr || '00:00'}:00`);
                updateSet.next_run_at = Math.floor(dt.getTime() / 1000);
            }
        }

        await db.from('scheduler_events').update(updateSet).eq('id', id);

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('PUT /api/scheduler/events/[id] error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// ─── DELETE: Delete event ───────────────────────────────────────────────────

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await db.from('scheduler_events').delete().eq('id', id);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('DELETE /api/scheduler/events/[id] error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
