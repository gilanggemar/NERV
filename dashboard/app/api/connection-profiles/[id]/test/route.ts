import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { getAuthUserId } from '@/lib/auth';

interface TestResult {
    openclaw: {
        tested: boolean;
        reachable: boolean;
        latencyMs: number | null;
        error: string | null;
        wsHandshake: boolean;
    };
    agentZero: {
        tested: boolean;
        reachable: boolean;
        latencyMs: number | null;
        error: string | null;
        apiKeyValid: boolean;
    };
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    const { id } = await params;
    const { data: profile, error } = await db.from('connection_profiles').select('*').eq('user_id', userId).eq('id', id).single();
    if (error || !profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const result: TestResult = {
        openclaw: { tested: false, reachable: false, latencyMs: null, error: null, wsHandshake: false },
        agentZero: { tested: false, reachable: false, latencyMs: null, error: null, apiKeyValid: false },
    };

    // --- Test OpenClaw ---
    if (profile.openclaw_enabled) {
        result.openclaw.tested = true;
        const startOC = Date.now();
        try {
            const httpUrl = profile.openclaw_http_url;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);

            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            const token = decrypt(profile.openclaw_auth_token);
            if (token && profile.openclaw_auth_mode === 'token') {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const resp = await fetch(httpUrl, { headers, signal: controller.signal });
            clearTimeout(timeout);

            result.openclaw.latencyMs = Date.now() - startOC;
            result.openclaw.reachable = resp.ok || resp.status === 401 || resp.status === 403;
            if (resp.ok) {
                result.openclaw.wsHandshake = true;
            } else if (resp.status === 401 || resp.status === 403) {
                result.openclaw.error = 'Server reachable but authentication failed. Check your token.';
            }
        } catch (err: any) {
            result.openclaw.latencyMs = Date.now() - startOC;
            result.openclaw.error = err.name === 'AbortError'
                ? 'Connection timed out after 8 seconds.'
                : `Connection failed: ${err.message}`;
        }
    }

    // --- Test Agent Zero ---
    if (profile.agent_zero_enabled) {
        result.agentZero.tested = true;
        const startAZ = Date.now();
        try {
            const baseUrl = profile.agent_zero_base_url;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);

            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            const apiKey = decrypt(profile.agent_zero_api_key);
            if (apiKey && profile.agent_zero_auth_mode === 'api_key') {
                headers['X-API-KEY'] = apiKey;
            }

            const resp = await fetch(`${baseUrl}/api_message`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ message: 'ping', context_id: 'nerv-health-check' }),
                signal: controller.signal,
            });
            clearTimeout(timeout);

            result.agentZero.latencyMs = Date.now() - startAZ;
            result.agentZero.reachable = resp.ok;
            result.agentZero.apiKeyValid = resp.ok;
            if (!resp.ok) {
                result.agentZero.error = `HTTP ${resp.status}: ${resp.statusText}`;
            }
        } catch (err: any) {
            result.agentZero.latencyMs = Date.now() - startAZ;
            result.agentZero.error = err.name === 'AbortError'
                ? 'Connection timed out after 8 seconds.'
                : `Connection failed: ${err.message}`;
        }
    }

    // Update profile metadata
    const healthStatus = (() => {
        const ocOk = !profile.openclaw_enabled || result.openclaw.reachable;
        const azOk = !profile.agent_zero_enabled || result.agentZero.reachable;
        if (ocOk && azOk) return 'healthy';
        if (ocOk || azOk) return 'degraded';
        return 'offline';
    })();

    await db.from('connection_profiles').update({
        last_connected_at: new Date().toISOString(),
        last_health_status: healthStatus,
        updated_at: new Date().toISOString(),
    }).eq('user_id', userId).eq('id', id);

    return NextResponse.json(result);
}
