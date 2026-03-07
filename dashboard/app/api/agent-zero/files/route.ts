import { NextResponse } from 'next/server';
import { resolveActiveConnection } from '@/lib/resolveActiveConnection';
import { getAuthUserId } from '@/lib/auth';

export async function POST(request: Request) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const body = await request.json();
        const { paths } = body;

        if (!paths || !Array.isArray(paths) || paths.length === 0) {
            return NextResponse.json(
                { error: 'A non-empty array of paths is required' },
                { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
            );
        }

        const { agentZero } = await resolveActiveConnection();
        const AGENT_ZERO_URL = agentZero.baseUrl;
        const AGENT_ZERO_API_KEY = agentZero.apiKey;

        if (!agentZero.enabled || !AGENT_ZERO_URL || !AGENT_ZERO_API_KEY) {
            return NextResponse.json(
                { error: 'Agent Zero is not configured' },
                { status: 503, headers: { 'Access-Control-Allow-Origin': '*' } }
            );
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const fwResponse = await fetch(`${AGENT_ZERO_URL}/api_files_get`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': AGENT_ZERO_API_KEY,
            },
            body: JSON.stringify({ paths }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!fwResponse.ok) {
            const errorText = await fwResponse.text().catch(() => 'Unknown error text');
            console.error(`[Agent Zero Proxy] Files route returned error status ${fwResponse.status}:`, errorText);
            return NextResponse.json(
                { error: `Agent Zero returned status ${fwResponse.status}`, details: errorText },
                { status: fwResponse.status, headers: { 'Access-Control-Allow-Origin': '*' } }
            );
        }

        const fwData = await fwResponse.json();

        return NextResponse.json(fwData, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });

    } catch (error: any) {
        console.error('[Agent Zero Proxy] Files proxy error:', error);
        const isTimeout = error.name === 'AbortError';

        return NextResponse.json(
            { error: "Agent Zero is not reachable", details: isTimeout ? 'Request timed out' : error.message },
            { status: 503, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
    }
}
