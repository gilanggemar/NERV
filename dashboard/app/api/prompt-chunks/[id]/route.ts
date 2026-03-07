import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const p = await params;
        const { data: chunk, error } = await db.from('prompt_chunks').select('*').eq('user_id', userId).eq('id', p.id).single();
        if (error || !chunk) {
            return NextResponse.json({ error: 'Chunk not found' }, { status: 404 });
        }
        return NextResponse.json({ chunk });
    } catch (error) {
        console.error('Failed to fetch prompt chunk:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const p = await params;
        const body = await req.json();

        // Check if exists
        const { data: existing } = await db.from('prompt_chunks').select('id').eq('user_id', userId).eq('id', p.id).single();
        if (!existing) {
            return NextResponse.json({ error: 'Chunk not found' }, { status: 404 });
        }

        const updates: any = {};
        if (body.name !== undefined) updates.name = body.name;
        if (body.content !== undefined) updates.content = body.content;
        if (body.color !== undefined) updates.color = body.color;
        if (body.category !== undefined) updates.category = body.category;
        if (body.order !== undefined) updates.order = body.order;

        updates.updated_at = new Date().toISOString();

        await db.from('prompt_chunks').update(updates).eq('id', p.id);

        const { data: updated } = await db.from('prompt_chunks').select('*').eq('user_id', userId).eq('id', p.id).single();
        return NextResponse.json({ chunk: updated });
    } catch (error) {
        console.error('Failed to update prompt chunk:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const p = await params;
        const { data: existing } = await db.from('prompt_chunks').select('id').eq('user_id', userId).eq('id', p.id).single();
        if (!existing) {
            return NextResponse.json({ error: 'Chunk not found' }, { status: 404 });
        }

        await db.from('prompt_chunks').delete().eq('user_id', userId).eq('id', p.id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete prompt chunk:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
