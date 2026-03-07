import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/encryption';
import { seedDefaultProfileIfEmpty } from '@/lib/seedDefaultProfile';
import { getAuthUserId } from '@/lib/auth';

// GET — List all profiles (secrets redacted)
export async function GET() {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    await seedDefaultProfileIfEmpty(userId);
    const { data: profiles, error } = await db.from('connection_profiles').select('*').eq('user_id', userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Map snake_case DB fields to camelCase for the frontend Store
    const mapped = (profiles || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        isActive: p.is_active,

        openclawEnabled: p.openclaw_enabled,
        openclawWsUrl: p.openclaw_ws_url,
        openclawHttpUrl: p.openclaw_http_url,
        openclawAuthMode: p.openclaw_auth_mode,
        openclawAuthToken: p.openclaw_auth_token ? '••••••••' : null,

        agentZeroEnabled: p.agent_zero_enabled,
        agentZeroBaseUrl: p.agent_zero_base_url,
        agentZeroAuthMode: p.agent_zero_auth_mode,
        agentZeroApiKey: p.agent_zero_api_key ? '••••••••' : null,
        agentZeroTransport: p.agent_zero_transport,

        lastConnectedAt: p.last_connected_at,
        lastHealthStatus: p.last_health_status,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
    }));

    return NextResponse.json(mapped);
}

// POST — Create a new profile
export async function POST(req: NextRequest) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    const body = await req.json();

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json({ error: 'Profile name is required' }, { status: 400 });
    }

    const id = crypto.randomUUID();

    await db.from('connection_profiles').insert({
        user_id: userId,
        id,
        name: body.name.trim(),
        description: body.description ?? null,
        is_active: false, // never auto-activate on create

        openclaw_enabled: body.openclawEnabled ?? true,
        openclaw_ws_url: body.openclawWsUrl ?? 'ws://127.0.0.1:18789',
        openclaw_http_url: body.openclawHttpUrl ?? 'http://127.0.0.1:18789',
        openclaw_auth_mode: body.openclawAuthMode ?? 'token',
        openclaw_auth_token: encrypt(body.openclawAuthToken ?? null),

        agent_zero_enabled: body.agentZeroEnabled ?? false,
        agent_zero_base_url: body.agentZeroBaseUrl ?? 'http://127.0.0.1:80',
        agent_zero_auth_mode: body.agentZeroAuthMode ?? 'api_key',
        agent_zero_api_key: encrypt(body.agentZeroApiKey ?? null),
        agent_zero_transport: body.agentZeroTransport ?? 'rest',
    });

    // Fetch the created profile
    const { data: created } = await db.from('connection_profiles').select('*').eq('user_id', userId).eq('id', id).single();

    return NextResponse.json({ ...created, id }, { status: 201 });
}
