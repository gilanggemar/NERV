import { NextResponse } from 'next/server';
import { getWarRoomSession, resolveWarRoomSession } from '@/lib/war-room/engine';
import { getAuthUserId } from '@/lib/auth';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    const { id } = await params;
    try {
        const session = await getWarRoomSession(id);
        if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(session);
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    const { id } = await params;
    try {
        const body = await request.json();
        if (body.status === 'resolved') {
            await resolveWarRoomSession(id, body.decision || '', body.actionItems || []);
        }
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
