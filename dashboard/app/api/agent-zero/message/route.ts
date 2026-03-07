import { NextResponse } from 'next/server';
import { resolveActiveConnection } from '@/lib/resolveActiveConnection';
import { logTelemetry } from '@/lib/telemetry/logger';
import { createTelemetryEntry } from '@/lib/telemetry/costs';
import { getAuthUserId } from '@/lib/auth';

export async function POST(request: Request) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const body = await request.json();
        const { message, context_id } = body;

        if (!message || typeof message !== 'string' || message.trim() === '') {
            return NextResponse.json(
                { error: 'Message is required' },
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

        const { attachments, lifetime_hours = 24, project } = body;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 min — A0 can take a while

        const requestBody: Record<string, any> = {
            message,
            lifetime_hours,
        };
        if (context_id) requestBody.context_id = context_id;
        if (attachments) requestBody.attachments = attachments;
        if (project) requestBody.project = project;

        const startTime = Date.now();
        const fwResponse = await fetch(`${AGENT_ZERO_URL}/api_message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': AGENT_ZERO_API_KEY,
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
        });
        const latencyMs = Date.now() - startTime;

        clearTimeout(timeoutId);

        if (!fwResponse.ok) {
            const errorText = await fwResponse.text().catch(() => 'Unknown error text');
            console.error(`[Agent Zero Proxy] Message route returned error status ${fwResponse.status}:`, errorText);

            // Log error telemetry
            try {
                await logTelemetry(createTelemetryEntry({
                    agentId: 'agent-zero',
                    provider: 'agent-zero',
                    model: 'agent-zero',
                    inputTokens: 0,
                    outputTokens: 0,
                    latencyMs,
                    status: 'error',
                    errorMessage: errorText,
                }));
            } catch (e) { /* ignore telemetry errors */ }

            return NextResponse.json(
                { error: `Agent Zero returned status ${fwResponse.status}`, details: errorText },
                { status: fwResponse.status, headers: { 'Access-Control-Allow-Origin': '*' } }
            );
        }

        const fwData = await fwResponse.json();

        // Log success telemetry with token usage if available from Agent Zero response
        try {
            const inputTokens = fwData.usage?.input_tokens || fwData.tokens_in || 0;
            const outputTokens = fwData.usage?.output_tokens || fwData.tokens_out || 0;
            await logTelemetry(createTelemetryEntry({
                agentId: 'agent-zero',
                provider: 'agent-zero',
                model: fwData.model || 'agent-zero',
                inputTokens,
                outputTokens,
                latencyMs,
                status: 'success',
            }));
        } catch (e) { /* ignore telemetry errors */ }

        return NextResponse.json(
            { response: fwData.response, context_id: fwData.context_id },
            { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
        );

    } catch (error: any) {
        console.error('[Agent Zero Proxy] Message proxy error:', error);
        const isTimeout = error.name === 'AbortError';

        return NextResponse.json(
            { error: "Agent Zero is not reachable", details: isTimeout ? 'Request timed out after 300s' : error.message },
            { status: 503, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
    }
}
