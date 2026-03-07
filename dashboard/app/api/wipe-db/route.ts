import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/wipe-db
export async function GET() {
    try {
        await db.from('workflow_runs').delete().neq('id', '');
        await db.from('workflows').delete().neq('id', '');
        return NextResponse.json({ success: true, message: "DB wiped" });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
