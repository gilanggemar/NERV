import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

// GET /api/wipe-db
export async function GET() {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        await db.from('workflow_runs').delete().eq('user_id', userId).neq('id', '');
        await db.from('workflows').delete().eq('user_id', userId).neq('id', '');
        return NextResponse.json({ success: true, message: "DB wiped" });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
