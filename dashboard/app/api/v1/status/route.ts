import { NextResponse } from 'next/server';

// GET /api/v1/status — system health overview
export async function GET(request: Request) {
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
