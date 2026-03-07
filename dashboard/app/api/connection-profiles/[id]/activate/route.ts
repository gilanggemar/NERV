import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    const { id } = await params;

    // Deactivate all profiles
    await db.from('connection_profiles').update({ is_active: false }).eq('user_id', userId).neq('id', '');

    // Activate the selected profile
    await db.from('connection_profiles').update({
        is_active: true,
        updated_at: new Date().toISOString(),
    }).eq('user_id', userId).eq('id', id);

    return NextResponse.json({ success: true, activatedId: id });
}
