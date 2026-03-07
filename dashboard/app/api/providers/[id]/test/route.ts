import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decryptApiKey } from '@/lib/providers/crypto';
import { providerRegistry } from '@/lib/providers/registry';
import type { ProviderType } from '@/lib/providers/types';

// POST /api/providers/[id]/test — test provider connection
export async function POST(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const { data: row, error } = await db.from('providers').select('*').eq('id', id).single();
        if (error || !row) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });

        const adapter = providerRegistry.get(row.type as ProviderType);
        if (!adapter) {
            return NextResponse.json({
                success: false,
                error: `Unknown provider type: ${row.type}`,
            });
        }

        const config = {
            apiKey: row.encrypted_api_key ? decryptApiKey(row.encrypted_api_key) : undefined,
            baseUrl: row.base_url || undefined,
        };

        const result = await adapter.testConnection(config);
        return NextResponse.json(result);
    } catch (error: unknown) {
        console.error('Failed to test provider:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Test failed',
        });
    }
}
