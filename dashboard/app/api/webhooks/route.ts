import { NextResponse } from 'next/server';
import { getWebhookConfigs, createWebhookConfig, deleteWebhookConfig } from '@/lib/scheduler/engine';
import { getAuthUserId } from '@/lib/auth';

export async function GET() {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const configs = await getWebhookConfigs();
        return NextResponse.json(configs);
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const { source, agentId, eventFilter, secret } = await request.json();
        if (!source || !agentId) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }
        const id = await createWebhookConfig(source, agentId, eventFilter, secret);
        return NextResponse.json({ id }, { status: 201 });
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (id) await deleteWebhookConfig(id);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
