import { NextResponse } from 'next/server';
import { resolveActiveConnection } from '@/lib/resolveActiveConnection';

/**
 * Returns the OpenClaw WebSocket URL and token for the active profile.
 * Called by the client-side gateway to get connection parameters.
 * The token is the ONLY secret exposed client-side (needed for WS auth).
 */
export async function GET() {
    const { openclaw, profileName } = await resolveActiveConnection();

    return NextResponse.json({
        profileName,
        enabled: openclaw.enabled,
        wsUrl: openclaw.wsUrl,
        httpUrl: openclaw.httpUrl,
        token: openclaw.token, // needed client-side for WS handshake
    });
}
