import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { encryptApiKey, maskApiKey, decryptApiKey } from '@/lib/providers/crypto';

// GET /api/providers — list all providers
export async function GET() {
    try {
        const { data: rows, error } = await db.from('providers').select('*');
        if (error) throw new Error(error.message);
        const result = (rows || []).map((row: any) => ({
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
        }));
        return NextResponse.json(result);
    } catch (error: unknown) {
        console.error('Failed to list providers:', error);
        return NextResponse.json({ error: 'Failed to list providers' }, { status: 500 });
    }
}

// POST /api/providers — create a new provider
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, type, apiKey, baseUrl } = body;

        if (!name || !type) {
            return NextResponse.json({ error: 'name and type are required' }, { status: 400 });
        }

        const id = crypto.randomUUID();

        const { error } = await db.from('providers').insert({
            id,
            name,
            type,
            encrypted_api_key: apiKey ? encryptApiKey(apiKey) : null,
            base_url: baseUrl || null,
            is_active: true,
        });

        if (error) throw new Error(error.message);

        return NextResponse.json({
            id,
            name,
            type,
            baseUrl,
            isActive: true,
            maskedKey: apiKey ? maskApiKey(apiKey) : undefined,
        }, { status: 201 });
    } catch (error: unknown) {
        console.error('Failed to create provider:', error);
        return NextResponse.json({ error: 'Failed to create provider' }, { status: 500 });
    }
}
