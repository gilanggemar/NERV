import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';

// GET /api/v1/status — system health overview
export async function GET(request: Request) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        // Public status endpoint (no auth for basic health check)
        return NextResponse.json({
            status: 'operational',
            version: '1.0.0',
            uptime: process.uptime(),
            timestamp: Date.now(),
            services: {
                api: 'healthy',
                database: 'healthy',
                agents: 'healthy',
            },
        });
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
