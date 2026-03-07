import { NextResponse } from 'next/server';
import { getWarRoomEvents, addWarRoomEvent } from '@/lib/war-room/engine';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        return NextResponse.json(await getWarRoomEvents(id));
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const { type, content, metadata = {}, agentId } = await request.json();
        if (!type || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

        const event = await addWarRoomEvent(id, type, content, metadata, agentId);
        return NextResponse.json(event, { status: 201 });
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
