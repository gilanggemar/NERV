import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

// GET /api/capabilities/assignments - List assignments with required filter
export async function GET(request: Request) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const { searchParams } = new URL(request.url);
        const agentId = searchParams.get('agent_id');
        const capabilityId = searchParams.get('capability_id');
        const capabilityType = searchParams.get('capability_type');

        if (!agentId && !(capabilityId && capabilityType)) {
            return NextResponse.json(
                { error: 'Either agent_id or (capability_id AND capability_type) is required' },
                { status: 400 }
            );
        }

        let query = db.from('agent_capability_assignments').select('*').eq('user_id', userId);

        if (agentId) {
            query = query.eq('agent_id', agentId);
        }
        if (capabilityId && capabilityType) {
            query = query.eq('capability_id', capabilityId).eq('capability_type', capabilityType);
        }

        const { data, error } = await query.order('assigned_at', { ascending: false });
        if (error) throw error;

        // Parse JSON fields
        const assignments = (data || []).map((row: any) => ({
            ...row,
            config_overrides: typeof row.config_overrides === 'string'
                ? JSON.parse(row.config_overrides)
                : row.config_overrides,
        }));

        return NextResponse.json({ data: assignments });
    } catch (error: unknown) {
        console.error('Failed to list assignments:', error);
        return NextResponse.json({ error: 'Failed to list assignments' }, { status: 500 });
    }
}

// POST /api/capabilities/assignments - Create assignment
export async function POST(request: Request) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const body = await request.json();
        const { agent_id, capability_type, capability_id } = body;

        if (!agent_id || !capability_type || !capability_id) {
            return NextResponse.json(
                { error: 'agent_id, capability_type, and capability_id are required' },
                { status: 400 }
            );
        }

        if (!['mcp', 'skill'].includes(capability_type)) {
            return NextResponse.json(
                { error: 'capability_type must be "mcp" or "skill"' },
                { status: 400 }
            );
        }

        // Check if assignment already exists
        const { data: existing } = await db
            .from('agent_capability_assignments')
            .select('id')
            .eq('agent_id', agent_id)
            .eq('capability_type', capability_type)
            .eq('capability_id', capability_id)
            .single();

        if (existing) {
            return NextResponse.json(
                { error: 'Assignment already exists' },
                { status: 409 }
            );
        }

        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        const { error } = await db.from('agent_capability_assignments').insert({ user_id: userId,
            id,
            agent_id,
            capability_type,
            capability_id,
            is_enabled: true,
            config_overrides: JSON.stringify({}),
            assigned_at: now,
        });

        if (error) throw error;

        return NextResponse.json({
            data: {
                id,
                agent_id,
                capability_type,
                capability_id,
                is_enabled: true,
                config_overrides: {},
                assigned_at: now,
            },
        }, { status: 201 });
    } catch (error: unknown) {
        console.error('Failed to create assignment:', error);
        return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
    }
}

// DELETE /api/capabilities/assignments?id=xxx - Delete assignment by ID
export async function DELETE(request: Request) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const { error } = await db
            .from('agent_capability_assignments')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Failed to delete assignment:', error);
        return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 });
    }
}
