import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/mcp/client';
import { getAuthUserId } from '@/lib/auth';

export async function POST(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    const { id } = await params;
    try {
        const result = await testConnection(id);
        return NextResponse.json(result);
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
