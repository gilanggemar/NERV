import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { seedDefaultProfileIfEmpty } from '@/lib/seedDefaultProfile';
import { getAuthUserId } from '@/lib/auth';


// GET — Active profile for client consumption (secrets fully redacted)
export async function GET() {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    await seedDefaultProfileIfEmpty(userId);

    const { data: profiles } = await db.from('connection_profiles')
        .select('*')
        .eq('user_id', userId)
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

        openclawEnabled: p.openclaw_enabled,
        openclawWsUrl: p.openclaw_ws_url,
        openclawHttpUrl: p.openclaw_http_url,
        openclawAuthMode: p.openclaw_auth_mode,
        openclawAuthToken: p.openclaw_auth_token ? '[REDACTED]' : null,

        agentZeroEnabled: p.agent_zero_enabled,
        agentZeroBaseUrl: p.agent_zero_base_url,
        agentZeroAuthMode: p.agent_zero_auth_mode,
        agentZeroApiKey: p.agent_zero_api_key ? '[REDACTED]' : null,
        agentZeroTransport: p.agent_zero_transport,

        lastConnectedAt: p.last_connected_at,
        lastHealthStatus: p.last_health_status,
        createdAt: p.created_at,
        updatedAt: p.updated_at
    });
}
