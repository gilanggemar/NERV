import { NextResponse } from 'next/server';
import { getMCPServers, addMCPServer } from '@/lib/mcp/client';

export async function GET() {
    try {
        const servers = await getMCPServers();
        return NextResponse.json(servers);
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(request: Request) {
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
