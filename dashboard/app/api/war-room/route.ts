import { NextResponse } from 'next/server';
import { getWarRoomSessions, createWarRoomSession } from '@/lib/war-room/engine';

export async function GET() {
    try {
        const sessions = await getWarRoomSessions();
        return NextResponse.json(sessions);
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { topic } = await request.json();
        if (!topic) return NextResponse.json({ error: 'Topic required' }, { status: 400 });
        const id = await createWarRoomSession(topic);
        return NextResponse.json({ id }, { status: 201 });
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
