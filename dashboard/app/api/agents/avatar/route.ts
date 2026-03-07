import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { uploadImage, isBase64DataUri } from '@/lib/supabaseStorage';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    if (!agentId) return NextResponse.json({ error: 'Missing agentId' }, { status: 400 });

    try {
        const { data, error } = await db.from('agents').select('avatar').eq('id', agentId).single();
        if (error) return NextResponse.json({ avatar: null });
        return NextResponse.json({ avatar: data?.avatar || null });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { agentId, avatar } = await request.json();
        if (!agentId) return NextResponse.json({ error: 'Missing agentId' }, { status: 400 });

        // Upload to Supabase Storage if it's a base64 data URI
        let avatarUrl = avatar;
        if (avatar && isBase64DataUri(avatar)) {
            const path = `avatars/${agentId}-${Date.now()}.png`;
            avatarUrl = await uploadImage(avatar, path);
        }

        const { data: existing } = await db.from('agents').select('id').eq('id', agentId).single();
        if (existing) {
            await db.from('agents').update({ avatar: avatarUrl }).eq('id', agentId);
        } else {
            await db.from('agents').insert({ id: agentId, avatar: avatarUrl });
        }
        return NextResponse.json({ success: true, avatar: avatarUrl });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
