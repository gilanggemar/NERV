/**
 * OpenClaw Proxy Route
 *
 * Server-side proxy that injects the auth token for OpenClaw REST requests.
 * The token is kept server-side only and never exposed to the browser.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOpenClawTokenOptional } from '@/lib/config';
import { getAuthUserId } from '@/lib/auth';

const getBaseUrl = () =>
    process.env.NEXT_PUBLIC_OPENCLAW_HTTP_URL ?? 'http://127.0.0.1:18789';

export async function POST(req: NextRequest) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const token = getOpenClawTokenOptional();
        const baseUrl = getBaseUrl();
        const body = await req.json();
        const { path, ...payload } = body;

        if (!path) {
            return NextResponse.json(
                { error: 'Missing "path" parameter' },
                { status: 400 }
            );
        }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${baseUrl}${path}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error('[OpenClaw Proxy] POST error:', error.message);
        return NextResponse.json(
            { error: 'Proxy request failed', details: error.message },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const token = getOpenClawTokenOptional();
        const baseUrl = getBaseUrl();
        const { searchParams } = new URL(req.url);
        const path = searchParams.get('path') ?? '/';

        const headers: Record<string, string> = {};

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${baseUrl}${path}`, { headers });

        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error('[OpenClaw Proxy] GET error:', error.message);
        return NextResponse.json(
            { error: 'Proxy request failed', details: error.message },
            { status: 500 }
        );
    }
}
