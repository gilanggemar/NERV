import { NextResponse } from 'next/server';
import { getBridges, createBridge } from '@/lib/bridges/engine';
import { getAuthUserId } from '@/lib/auth';

export async function GET() {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const bridges = await getBridges();
        return NextResponse.json(bridges);
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const { platform, name, apiKey, webhookUrl } = await request.json();
        if (!platform || !name) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }
        const id = await createBridge(platform, name, apiKey, webhookUrl);
        return NextResponse.json({ id }, { status: 201 });
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
