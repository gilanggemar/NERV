import { NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api/auth';
import { getScheduledTasks, createScheduledTask } from '@/lib/scheduler/engine';
import { getNotifications, getUnreadCount } from '@/lib/notifications/engine';
import { getAuthUserId } from '@/lib/auth';

// GET /api/v1/tasks — list workflows and schedules
export async function GET(request: Request) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    const { valid, error } = await validateApiKey(request.headers.get('authorization'));
    if (!valid) return NextResponse.json({ error }, { status: 401 });

    try {
        const schedules = await getScheduledTasks();
        const notifs = await getNotifications(20);
        return NextResponse.json({
            schedules,
            notifications: { items: notifs, unreadCount: await getUnreadCount() },
        });
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// POST /api/v1/tasks — create a scheduled task
export async function POST(request: Request) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    const { valid, error } = await validateApiKey(request.headers.get('authorization'));
    if (!valid) return NextResponse.json({ error }, { status: 401 });

    try {
        const { agentId, cronExpression, description } = await request.json();
        if (!agentId || !cronExpression || !description) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }
        const id = await createScheduledTask(agentId, cronExpression, description);
        return NextResponse.json({ id }, { status: 201 });
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
