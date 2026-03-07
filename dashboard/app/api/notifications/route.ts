import { NextResponse } from 'next/server';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification } from '@/lib/notifications/engine';
import { getAuthUserId } from '@/lib/auth';

// GET /api/notifications
export async function GET(request: Request) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const { searchParams } = new URL(request.url);
        const unreadOnly = searchParams.get('unreadOnly') === 'true';
        const limit = parseInt(searchParams.get('limit') || '50');

        return NextResponse.json({
            notifications: await getNotifications(limit, unreadOnly),
            unreadCount: await getUnreadCount(),
        });
    } catch (error: unknown) {
        console.error('Failed:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// PATCH /api/notifications — mark read
export async function PATCH(request: Request) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const body = await request.json();
        if (body.all) {
            await markAllAsRead();
        } else if (body.id) {
            await markAsRead(body.id);
        }
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// DELETE /api/notifications?id=X
export async function DELETE(request: Request) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const { searchParams } = new URL(request.url);
        const id = parseInt(searchParams.get('id') || '0');
        if (id) await deleteNotification(id);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
