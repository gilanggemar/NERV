import { NextResponse } from 'next/server';
import { resolveActiveConnection } from '@/lib/resolveActiveConnection';

export async function GET() {
    const { agentZero } = await resolveActiveConnection();
    const AGENT_ZERO_URL = agentZero.baseUrl;
    const username = process.env.AGENT_ZERO_USERNAME;
    const password = process.env.AGENT_ZERO_PASSWORD;

    if (!AGENT_ZERO_URL || !username || !password) {
        return NextResponse.json(
            { error: 'Agent Zero URL or credentials are not configured' },
            { status: 503 }
        );
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        // 1. Programmatically login to Agent Zero
        const loginRes = await fetch(`${AGENT_ZERO_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ username, password }),
            redirect: 'manual',
            signal: controller.signal,
        });

        // 2. Extract Session Cookie
        const loginCookies = loginRes.headers.getSetCookie() || [];
        const sessionCookieFull = loginCookies.find(c => c.startsWith('session_'));
        const sessionCookieStr = sessionCookieFull?.split(';')[0]; // Extract just the key=value

        if (!sessionCookieStr) {
            clearTimeout(timeoutId);
            return NextResponse.json({ error: 'Failed to establish Agent Zero session' }, { status: 401 });
        }

        // 3. Fetch CSRF Token using the session
        const csrfRes = await fetch(`${AGENT_ZERO_URL}/csrf_token`, {
            method: 'GET',
            headers: { Cookie: sessionCookieStr },
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!csrfRes.ok) {
            const errorText = await csrfRes.text().catch(() => 'Unknown error text');
            return NextResponse.json(
                { error: `Agent Zero CSRF returned ${csrfRes.status}`, details: errorText },
                { status: csrfRes.status }
            );
        }

        const data = await csrfRes.json();

        // 4. Forward the new cookies (session + csrf) to the Next.js browser response
        const response = NextResponse.json(data, { status: 200 });

        const csrfCookies = csrfRes.headers.getSetCookie() || [];
        for (const cookie of csrfCookies) {
            // Strip Secure and SameSite flags if testing locally to prevent cookie rejection
            // but keep the vanilla values to be safe. We'll forward them directly.
            let adjustedCookie = cookie;
            if (process.env.NODE_ENV === 'development') {
                adjustedCookie = adjustedCookie.replace(/;\s*Secure/i, '').replace(/;\s*SameSite=Strict/i, '; SameSite=Lax');
            }
            response.headers.append('Set-Cookie', adjustedCookie);
        }

        return response;

    } catch (error: any) {
        console.error('[Agent Zero Proxy] Auth Sequence Error:', error.message);
        return NextResponse.json(
            { error: 'Agent Zero is not reachable', details: error.name === 'AbortError' ? 'Request timed out' : error.message },
            { status: 503 }
        );
    }
}
