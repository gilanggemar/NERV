import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decryptApiKey } from '@/lib/providers/crypto';
import { providerRegistry } from '@/lib/providers/registry';
import type { ProviderType } from '@/lib/providers/types';
import { getAuthUserId } from '@/lib/auth';

// GET /api/providers/[id]/models — list available models for a provider
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    const { id } = await params;
    try {
        const { data: row, error } = await db.from('providers').select('*').eq('user_id', userId).eq('id', id).single();
        if (error || !row) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });

        const adapter = providerRegistry.get(row.type as ProviderType);
        if (!adapter) {
            return NextResponse.json({ error: `Unknown provider type: ${row.type}` }, { status: 400 });
        }

        const config = {
            apiKey: row.encrypted_api_key ? decryptApiKey(row.encrypted_api_key) : undefined,
            baseUrl: row.base_url || undefined,
        };

        const models = await adapter.listModels(config);
        return NextResponse.json(models);
    } catch (error: unknown) {
        console.error('Failed to list models:', error);
        return NextResponse.json({ error: 'Failed to list models' }, { status: 500 });
    }
}
