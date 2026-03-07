import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { uploadImage, isBase64DataUri } from '@/lib/supabaseStorage';
import { getAuthUserId } from '@/lib/auth';

export async function GET(request: Request) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    if (!agentId) return NextResponse.json({ error: 'Missing agentId' }, { status: 400 });

    try {
        const { data, error } = await db.from('agents').select('avatar').eq('user_id', userId).eq('id', agentId).single();
        if (error) return NextResponse.json({ avatar: null });
        return NextResponse.json({ avatar: data?.avatar || null });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const { agentId, avatar } = await request.json();
        if (!agentId) return NextResponse.json({ error: 'Missing agentId' }, { status: 400 });

        // Upload to Supabase Storage if it's a base64 data URI
        let avatarUrl = avatar;
        if (avatar && isBase64DataUri(avatar)) {
            const path = `avatars/${agentId}-${Date.now()}.png`;
            avatarUrl = await uploadImage(avatar, path);
        }

        const { data: existing } = await db.from('agents').select('id').eq('user_id', userId).eq('id', agentId).single();
        if (existing) {
            await db.from('agents').update({ avatar: avatarUrl }).eq('user_id', userId).eq('id', agentId);
        } else {
            await db.from('agents').insert({ user_id: userId, id: agentId, avatar: avatarUrl });
        }
        return NextResponse.json({ success: true, avatar: avatarUrl });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
