import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { WorkflowStep } from '@/lib/workflows/types';

// GET /api/workflows — list all workflows
export async function GET() {
    try {
        const { data: rows, error } = await db.from('workflows').select('*').order('updated_at', { ascending: false });
        if (error) throw new Error(error.message);
        // steps and schedule are already parsed by Supabase (jsonb columns)
        return NextResponse.json(rows);
    } catch (error: unknown) {
        console.error('Failed to list workflows:', error);
        return NextResponse.json({ error: 'Failed to list workflows' }, { status: 500 });
    }
}

// POST /api/workflows — create a new workflow
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, description, steps, schedule, status } = body;

        if (!name || !steps) {
            return NextResponse.json({ error: 'name and steps are required' }, { status: 400 });
        }

        const id = crypto.randomUUID();

        // Assign IDs to steps if missing
        const stepsWithIds: WorkflowStep[] = steps.map((s: any, i: number) => ({
            ...s,
            id: s.id || `step-${i}`,
        }));

        const { data, error } = await db.from('workflows').insert({
            id,
            name,
            description: description || null,
            steps: stepsWithIds,
            schedule: schedule || null,
            status: status || 'draft',
        }).select().single();

        if (error) throw new Error(error.message);

        return NextResponse.json(data, { status: 201 });
    } catch (error: unknown) {
        console.error('Failed to create workflow:', error);
        return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 });
    }
}
