import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

// POST /api/capabilities/assignments/bulk - Bulk assign
export async function POST(request: Request) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const body = await request.json();
        const { agent_ids, capability_type, capability_id } = body;

        if (!agent_ids || !Array.isArray(agent_ids) || agent_ids.length === 0) {
            return NextResponse.json({ error: 'agent_ids array is required' }, { status: 400 });
        }

        if (!capability_type || !capability_id) {
            return NextResponse.json(
                { error: 'capability_type and capability_id are required' },
                { status: 400 }
            );
        }

        if (!['mcp', 'skill'].includes(capability_type)) {
            return NextResponse.json(
                { error: 'capability_type must be "mcp" or "skill"' },
                { status: 400 }
            );
        }

        // Get existing assignments to avoid duplicates
        const { data: existing } = await db
            .from('agent_capability_assignments')
            .select('agent_id')
            .eq('capability_type', capability_type)
            .eq('capability_id', capability_id)
            .in('agent_id', agent_ids);

        const existingAgentIds = new Set((existing || []).map((e: any) => e.agent_id));
        const newAgentIds = agent_ids.filter((id: string) => !existingAgentIds.has(id));

        if (newAgentIds.length === 0) {
            return NextResponse.json({
                message: 'All assignments already exist',
                created: 0,
            });
        }

        const now = new Date().toISOString();
        const assignments = newAgentIds.map((agentId: string) => ({
            id: crypto.randomUUID(),
            agent_id: agentId,
            capability_type,
            capability_id,
            is_enabled: true,
            config_overrides: JSON.stringify({}),
            assigned_at: now,
        }));

        const { error } = await db
            .from('agent_capability_assignments')
            .insert(assignments);

        if (error) throw error;

        return NextResponse.json({
            message: 'Bulk assignment successful',
            created: assignments.length,
        }, { status: 201 });
    } catch (error: unknown) {
        console.error('Failed to bulk assign:', error);
        return NextResponse.json({ error: 'Failed to bulk assign' }, { status: 500 });
    }
}

// DELETE /api/capabilities/assignments/bulk - Bulk unassign
export async function DELETE(request: Request) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const body = await request.json();
        const { agent_ids, capability_type, capability_id } = body;

        if (!agent_ids || !Array.isArray(agent_ids) || agent_ids.length === 0) {
            return NextResponse.json({ error: 'agent_ids array is required' }, { status: 400 });
        }

        if (!capability_type || !capability_id) {
            return NextResponse.json(
                { error: 'capability_type and capability_id are required' },
                { status: 400 }
            );
        }

        const { error } = await db
            .from('agent_capability_assignments')
            .delete()
            .eq('capability_type', capability_type)
            .eq('capability_id', capability_id)
            .in('agent_id', agent_ids);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Failed to bulk unassign:', error);
        return NextResponse.json({ error: 'Failed to bulk unassign' }, { status: 500 });
    }
}
