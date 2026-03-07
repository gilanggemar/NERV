import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/memory/conversations — list conversations, optionally by agentId
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const agentId = searchParams.get('agentId');

        let query = db.from('conversations').select('*').order('updated_at', { ascending: false });
        if (agentId) query = query.eq('agent_id', agentId);

        const { data: rows, error } = await query;
        if (error) throw new Error(error.message);
        return NextResponse.json(rows);
    } catch (error: unknown) {
        console.error('Failed to list conversations:', error);
        return NextResponse.json({ error: 'Failed to list conversations' }, { status: 500 });
    }
}

// POST /api/memory/conversations — create a new conversation
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { agentId, title } = body;

        if (!agentId || !title) {
            return NextResponse.json({ error: 'agentId and title are required' }, { status: 400 });
        }

        const id = crypto.randomUUID();

        const { data, error } = await db.from('conversations').insert({
            id,
            agent_id: agentId,
            title,
            message_count: 0,
        }).select().single();

        if (error) throw new Error(error.message);

        return NextResponse.json(data, { status: 201 });
    } catch (error: unknown) {
        console.error('Failed to create conversation:', error);
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }
}
