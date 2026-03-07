import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/capabilities/skills/[id] - Get single skill by ID
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const { data, error } = await db
            .from('capability_skills')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) {
            return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
        }

        const skill = {
            ...data,
            tags: typeof data.tags === 'string' ? JSON.parse(data.tags) : data.tags,
            config_json: typeof data.config_json === 'string' ? JSON.parse(data.config_json) : data.config_json,
        };

        return NextResponse.json({ data: skill });
    } catch (error: unknown) {
        console.error('Failed to get skill:', error);
        return NextResponse.json({ error: 'Failed to get skill' }, { status: 500 });
    }
}

// PUT /api/capabilities/skills/[id] - Update skill by ID
export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();

        const updates: Record<string, any> = {
            updated_at: new Date().toISOString(),
        };

        const allowedFields = [
            'name', 'description', 'content', 'version', 'status',
            'category', 'icon', 'tags', 'config_json'
        ];

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                if (field === 'tags' || field === 'config_json') {
                    updates[field] = JSON.stringify(body[field]);
                } else {
                    updates[field] = body[field];
                }
            }
        }

        const { data, error } = await db
            .from('capability_skills')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        const skill = {
            ...data,
            tags: typeof data.tags === 'string' ? JSON.parse(data.tags) : data.tags,
            config_json: typeof data.config_json === 'string' ? JSON.parse(data.config_json) : data.config_json,
        };

        return NextResponse.json({ data: skill });
    } catch (error: unknown) {
        console.error('Failed to update skill:', error);
        return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 });
    }
}

// DELETE /api/capabilities/skills/[id] - Delete skill by ID
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Delete related assignments first
        await db
            .from('agent_capability_assignments')
            .delete()
            .eq('capability_type', 'skill')
            .eq('capability_id', id);

        // Delete the skill
        const { error } = await db
            .from('capability_skills')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Failed to delete skill:', error);
        return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 });
    }
}
