import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { encryptApiKey, decryptApiKey, maskApiKey } from '@/lib/providers/crypto';

// GET /api/providers/[id]
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const { data: row, error } = await db.from('providers').select('*').eq('id', id).single();
        if (error || !row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        return NextResponse.json({
            id: row.id,
            name: row.name,
            type: row.type,
            baseUrl: row.base_url,
            isActive: !!row.is_active,
            maskedKey: row.encrypted_api_key
                ? maskApiKey(decryptApiKey(row.encrypted_api_key))
                : undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        });
    } catch (error: unknown) {
        console.error('Failed to get provider:', error);
        return NextResponse.json({ error: 'Failed to get provider' }, { status: 500 });
    }
}

// PUT /api/providers/[id]
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

        if (body.name !== undefined) updates.name = body.name;
        if (body.type !== undefined) updates.type = body.type;
        if (body.baseUrl !== undefined) updates.base_url = body.baseUrl;
        if (body.isActive !== undefined) updates.is_active = !!body.isActive;
        if (body.apiKey !== undefined) {
            updates.encrypted_api_key = body.apiKey ? encryptApiKey(body.apiKey) : null;
        }

        await db.from('providers').update(updates).eq('id', id);

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Failed to update provider:', error);
        return NextResponse.json({ error: 'Failed to update provider' }, { status: 500 });
    }
}

// DELETE /api/providers/[id]
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await db.from('providers').delete().eq('id', id);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Failed to delete provider:', error);
        return NextResponse.json({ error: 'Failed to delete provider' }, { status: 500 });
    }
}
