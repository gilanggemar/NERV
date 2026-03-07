import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/memory/documents?agentId=X
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const agentId = searchParams.get('agentId');
        let query = db.from('knowledge_documents').select('*').order('created_at', { ascending: false });
        if (agentId) query = query.eq('agent_id', agentId);
        const { data: rows, error } = await query;
        if (error) throw new Error(error.message);
        return NextResponse.json(rows);
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// POST /api/memory/documents — upload document
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { agentId, fileName, fileType, content } = body;
        if (!agentId || !fileName || !content) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }
        const id = crypto.randomUUID();
        const { error } = await db.from('knowledge_documents').insert({
            id,
            agent_id: agentId,
            file_name: fileName,
            file_type: fileType || null,
            content,
            size_bytes: new TextEncoder().encode(content).length,
            indexed: false,
        });
        if (error) throw new Error(error.message);
        return NextResponse.json({ id }, { status: 201 });
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// DELETE /api/memory/documents?id=X
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (id) await db.from('knowledge_documents').delete().eq('id', id);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
