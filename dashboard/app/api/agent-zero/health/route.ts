import { NextResponse } from 'next/server';
import { resolveActiveConnection } from '@/lib/resolveActiveConnection';

export async function GET() {
    const { agentZero } = await resolveActiveConnection();
    const AGENT_ZERO_URL = agentZero.baseUrl;

    if (!agentZero.enabled || !AGENT_ZERO_URL) {
        return NextResponse.json(
            { status: 'unconfigured', message: 'Agent Zero is not enabled in the active connection profile' },
            { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${AGENT_ZERO_URL}/`, {
            method: 'GET',
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            return NextResponse.json(
                { status: 'online', url: AGENT_ZERO_URL, timestamp: Date.now() },
                { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
            );
        } else {
            console.warn(`[Agent Zero Proxy] Health check returned non-2xx status: ${response.status}`);
            return NextResponse.json(
                { status: 'offline', error: `Connection failed with status ${response.status}`, timestamp: Date.now() },
                { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
            );
        }
    } catch (error: any) {
        console.error('[Agent Zero Proxy] Health check error:', error.message);
        return NextResponse.json(
            { status: 'offline', error: error.name === 'AbortError' ? 'Connection timed out' : 'Connection failed', timestamp: Date.now() },
            { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
    }
}
