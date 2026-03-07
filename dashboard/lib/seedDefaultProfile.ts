import { db } from './db';
import { encrypt } from './encryption';

/**
 * Seeds a default connection profile from env vars if no profiles exist.
 * Reads the actual connection settings so the profile mirrors the running config.
 */
export async function seedDefaultProfileIfEmpty(): Promise<void> {
    const { data: existing } = await db.from('connection_profiles').select('id').limit(1);
    if (existing && existing.length > 0) return;

    // Read current connection settings from environment
    const ocWsUrl = process.env.NEXT_PUBLIC_OPENCLAW_WS_URL || process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_URL || 'ws://127.0.0.1:18789';
    const ocHttpUrl = process.env.NEXT_PUBLIC_OPENCLAW_HTTP_URL || 'http://127.0.0.1:18789';
    const ocToken = process.env.OPENCLAW_AUTH_TOKEN || process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_TOKEN || null;

    const azBaseUrl = process.env.AGENT_ZERO_URL || process.env.NEXT_PUBLIC_AGENT_ZERO_BASE_URL || 'http://127.0.0.1:80';
    const azApiKey = process.env.AGENT_ZERO_API_KEY || null;
    const azEnabled = !!process.env.AGENT_ZERO_URL;

    await db.from('connection_profiles').insert({
        id: crypto.randomUUID(),
        name: 'Current Environment',
        description: 'Auto-configured from your .env.local settings.',
        is_active: true,
        openclaw_enabled: true,
        openclaw_ws_url: ocWsUrl,
        openclaw_http_url: ocHttpUrl,
        openclaw_auth_mode: ocToken ? 'token' : 'none',
        openclaw_auth_token: encrypt(ocToken),
        agent_zero_enabled: azEnabled,
        agent_zero_base_url: azBaseUrl,
        agent_zero_auth_mode: azApiKey ? 'api_key' : 'none',
        agent_zero_api_key: encrypt(azApiKey),
        agent_zero_transport: 'rest',
    });
}
