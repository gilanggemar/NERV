import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/capabilities/mcps - List all MCPs with optional status filter
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let query = db.from('capability_mcps').select('*');
        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        // Parse JSON fields
        const mcps = (data || []).map((row: any) => ({
            ...row,
            tools: typeof row.tools === 'string' ? JSON.parse(row.tools) : row.tools,
            config_json: typeof row.config_json === 'string' ? JSON.parse(row.config_json) : row.config_json,
        }));

        return NextResponse.json({ data: mcps });
    } catch (error: unknown) {
        console.error('Failed to list MCPs:', error);
        return NextResponse.json({ error: 'Failed to list MCPs' }, { status: 500 });
    }
}

// POST /api/capabilities/mcps - Create a new MCP
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            name,
            description,
            server_url,
            transport = 'sse',
            auth_type = 'none',
            encrypted_credentials,
            tools = [],
            icon,
            category = 'general',
            config_json = {},
        } = body;

        if (!name || !server_url) {
            return NextResponse.json({ error: 'name and server_url are required' }, { status: 400 });
        }

        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        const { error } = await db.from('capability_mcps').insert({
            id,
            name,
            description,
            server_url,
            transport,
            status: 'active',
            auth_type,
            encrypted_credentials,
            tools: JSON.stringify(tools),
            icon,
            category,
            config_json: JSON.stringify(config_json),
            created_at: now,
            updated_at: now,
        });

        if (error) throw error;

        return NextResponse.json({
            data: {
                id,
                name,
                description,
                server_url,
                transport,
                status: 'active',
                auth_type,
                tools,
                icon,
                category,
                config_json,
                created_at: now,
                updated_at: now,
            },
        }, { status: 201 });
    } catch (error: unknown) {
        console.error('Failed to create MCP:', error);
        return NextResponse.json({ error: 'Failed to create MCP' }, { status: 500 });
    }
}
