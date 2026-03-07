import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/encryption';
import { seedDefaultProfileIfEmpty } from '@/lib/seedDefaultProfile';

// GET — List all profiles (secrets redacted)
export async function GET() {
    await seedDefaultProfileIfEmpty();
    const { data: profiles, error } = await db.from('connection_profiles').select('*');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Redact secrets before sending to client
    const redacted = (profiles || []).map((p: any) => ({
        ...p,
        openclaw_auth_token: p.openclaw_auth_token ? '••••••••' : null,
        agent_zero_api_key: p.agent_zero_api_key ? '••••••••' : null,
    }));

    return NextResponse.json(redacted);
}

// POST — Create a new profile
export async function POST(req: NextRequest) {
    const body = await req.json();

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json({ error: 'Profile name is required' }, { status: 400 });
    }

    const id = crypto.randomUUID();

    await db.from('connection_profiles').insert({
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
    const { data: created } = await db.from('connection_profiles').select('*').eq('id', id).single();

    return NextResponse.json({ ...created, id }, { status: 201 });
}
