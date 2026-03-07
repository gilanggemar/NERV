import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { seedDefaultProfileIfEmpty } from '@/lib/seedDefaultProfile';

// GET — Active profile for client consumption (secrets fully redacted)
export async function GET() {
    await seedDefaultProfileIfEmpty();

    const { data: profiles } = await db.from('connection_profiles')
        .select('*')
        .eq('is_active', true)
        .limit(1);

    if (!profiles || profiles.length === 0) {
        return NextResponse.json({ error: 'No active profile' }, { status: 404 });
    }

    const p = profiles[0];

    return NextResponse.json({
        id: p.id,
        name: p.name,
        description: p.description,
        isActive: true,
        openclaw: {
            enabled: p.openclaw_enabled,
            wsUrl: p.openclaw_ws_url,
            httpUrl: p.openclaw_http_url,
            authMode: p.openclaw_auth_mode,
            hasToken: !!p.openclaw_auth_token,
        },
        agentZero: {
            enabled: p.agent_zero_enabled,
            baseUrl: p.agent_zero_base_url,
            authMode: p.agent_zero_auth_mode,
            transport: p.agent_zero_transport,
            hasApiKey: !!p.agent_zero_api_key,
        },
        metadata: {
            lastConnectedAt: p.last_connected_at,
            lastHealthStatus: p.last_health_status,
        },
    });
}
