import { NextResponse } from 'next/server';
import { resolveActiveConnection } from '@/lib/resolveActiveConnection';

export async function POST(request: Request) {
    const { agentZero } = await resolveActiveConnection();
    const AGENT_ZERO_URL = agentZero.baseUrl;
    const AGENT_ZERO_API_KEY = agentZero.apiKey;

    if (!agentZero.enabled || !AGENT_ZERO_URL || !AGENT_ZERO_API_KEY) {
        return NextResponse.json(
            { error: 'Agent Zero is not configured' },
            { status: 503 }
        );
    }

    try {
        const body = await request.json();
        const { context_id } = body;

        if (!context_id) {
            return NextResponse.json(
                { error: 'context_id is required' },
                { status: 400 }
            );
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const fwResponse = await fetch(`${AGENT_ZERO_URL}/api_reset_chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': AGENT_ZERO_API_KEY,
            },
            body: JSON.stringify({ context_id }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!fwResponse.ok) {
            const errorText = await fwResponse.text().catch(() => 'Unknown error');
            return NextResponse.json(
                { error: `Agent Zero returned status ${fwResponse.status}`, details: errorText },
                { status: fwResponse.status }
            );
        }

        const data = await fwResponse.json();
        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        console.error('[Agent Zero Proxy] Reset error:', error.message);
        return NextResponse.json(
            { error: 'Agent Zero is not reachable', details: error.name === 'AbortError' ? 'Request timed out' : error.message },
            { status: 503 }
        );
    }
}
