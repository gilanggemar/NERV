import { NextResponse } from 'next/server';
import { searchKnowledge, getRecentKnowledge, addKnowledge } from '@/lib/memory/knowledge';

// GET /api/memory/knowledge — search or list knowledge fragments
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const agentId = searchParams.get('agentId');
        const query = searchParams.get('q');
        const limit = parseInt(searchParams.get('limit') || '20');

        if (!agentId) {
            return NextResponse.json({ error: 'agentId is required' }, { status: 400 });
        }

        const results = query
            ? await searchKnowledge(agentId, query, limit)
            : await getRecentKnowledge(agentId, limit);

        return NextResponse.json(results);
    } catch (error: unknown) {
        console.error('Failed to search knowledge:', error);
        return NextResponse.json({ error: 'Failed to search knowledge' }, { status: 500 });
    }
}

// POST /api/memory/knowledge — add a knowledge fragment
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { agentId, content, source, tags, importance } = body;

        if (!agentId || !content || !source) {
            return NextResponse.json({ error: 'agentId, content, and source are required' }, { status: 400 });
        }

        const id = await addKnowledge(agentId, content, source, tags || [], importance || 5);
        return NextResponse.json({ id }, { status: 201 });
    } catch (error: unknown) {
        console.error('Failed to add knowledge:', error);
        return NextResponse.json({ error: 'Failed to add knowledge' }, { status: 500 });
    }
}
