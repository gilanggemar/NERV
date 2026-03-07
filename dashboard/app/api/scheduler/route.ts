import { NextResponse } from 'next/server';
import { getScheduledTasks, createScheduledTask } from '@/lib/scheduler/engine';

export async function GET() {
    try {
        const tasks = await getScheduledTasks();
        return NextResponse.json(tasks);
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(request: Request) {
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
