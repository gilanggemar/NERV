import { NextResponse } from 'next/server';
import { getAlertRules, createAlertRule } from '@/lib/notifications/engine';
import { getAuthUserId } from '@/lib/auth';

// GET /api/alerts
export async function GET() {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const rules = await getAlertRules();
        return NextResponse.json(rules);
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// POST /api/alerts
export async function POST(request: Request) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const body = await request.json();
        const { name, condition, threshold, severity, agentId, channels, cooldownMs } = body;
        if (!name || !condition || threshold === undefined || !severity) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }
        const id = await createAlertRule({
            name, condition, threshold, severity,
            agentId: agentId || undefined,
            channels: channels || ['dashboard'],
            isActive: true,
            cooldownMs: cooldownMs || 300000,
        });
        return NextResponse.json({ id }, { status: 201 });
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
