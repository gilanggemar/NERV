import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/capabilities/mcps/[id] - Get single MCP by ID
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const { data, error } = await db
            .from('capability_mcps')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) {
            return NextResponse.json({ error: 'MCP not found' }, { status: 404 });
        }

        const mcp = {
            ...data,
            tools: typeof data.tools === 'string' ? JSON.parse(data.tools) : data.tools,
            config_json: typeof data.config_json === 'string' ? JSON.parse(data.config_json) : data.config_json,
        };

        return NextResponse.json({ data: mcp });
    } catch (error: unknown) {
        console.error('Failed to get MCP:', error);
        return NextResponse.json({ error: 'Failed to get MCP' }, { status: 500 });
    }
}

// PUT /api/capabilities/mcps/[id] - Update MCP by ID
export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();

        const updates: Record<string, any> = {
            updated_at: new Date().toISOString(),
        };

        const allowedFields = [
            'name', 'description', 'server_url', 'transport', 'status',
            'auth_type', 'encrypted_credentials', 'tools', 'icon', 'category', 'config_json'
        ];

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                if (field === 'tools' || field === 'config_json') {
                    updates[field] = JSON.stringify(body[field]);
                } else {
                    updates[field] = body[field];
                }
            }
        }

        const { data, error } = await db
            .from('capability_mcps')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        const mcp = {
            ...data,
            tools: typeof data.tools === 'string' ? JSON.parse(data.tools) : data.tools,
            config_json: typeof data.config_json === 'string' ? JSON.parse(data.config_json) : data.config_json,
        };

        return NextResponse.json({ data: mcp });
    } catch (error: unknown) {
        console.error('Failed to update MCP:', error);
        return NextResponse.json({ error: 'Failed to update MCP' }, { status: 500 });
    }
}

// DELETE /api/capabilities/mcps/[id] - Delete MCP by ID
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Delete related assignments first
        await db
            .from('agent_capability_assignments')
            .delete()
            .eq('capability_type', 'mcp')
            .eq('capability_id', id);

        // Delete the MCP
        const { error } = await db
            .from('capability_mcps')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Failed to delete MCP:', error);
        return NextResponse.json({ error: 'Failed to delete MCP' }, { status: 500 });
    }
}
