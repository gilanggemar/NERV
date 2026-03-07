import { NextResponse } from 'next/server';
import { getBridges, createBridge } from '@/lib/bridges/engine';

export async function GET() {
    try {
        const bridges = await getBridges();
        return NextResponse.json(bridges);
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(request: Request) {
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
