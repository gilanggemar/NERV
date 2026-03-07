import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // Deactivate all profiles
    await db.from('connection_profiles').update({ is_active: false }).neq('id', '');

    // Activate the selected profile
    await db.from('connection_profiles').update({
        is_active: true,
        updated_at: new Date().toISOString(),
    }).eq('id', id);

    return NextResponse.json({ success: true, activatedId: id });
}
