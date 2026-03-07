import { NextResponse } from 'next/server';
import { getMCPServers, addMCPServer } from '@/lib/mcp/client';
import { getAuthUserId } from '@/lib/auth';

export async function GET() {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const servers = await getMCPServers();
        return NextResponse.json(servers);
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const { name, url, transport, description, apiKey } = await request.json();
        if (!name || !url || !transport) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }
        const id = await addMCPServer(name, url, transport, description, apiKey);
        return NextResponse.json({ id }, { status: 201 });
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
