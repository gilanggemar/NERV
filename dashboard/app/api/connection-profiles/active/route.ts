import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { seedDefaultProfileIfEmpty } from '@/lib/seedDefaultProfile';

// GET — Returns the active profile WITH decrypted secrets.
// This route is ONLY called by server-side code and Next.js API routes.
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
            _token: decrypt(p.openclaw_auth_token),
        },

        agentZero: {
            enabled: p.agent_zero_enabled,
            baseUrl: p.agent_zero_base_url,
            authMode: p.agent_zero_auth_mode,
            transport: p.agent_zero_transport,
            _apiKey: decrypt(p.agent_zero_api_key),
        },

        metadata: {
            lastConnectedAt: p.last_connected_at,
            lastHealthStatus: p.last_health_status,
        },
    });
}
