// ─── API Key Auth ────────────────────────────────────────────────────────────

import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import type { ApiKey, ApiPermission } from './types';

function hashKey(key: string): string {
    // Simple hash for demo; in production use crypto.subtle.digest
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        const chr = key.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

export function generateApiKey(): { key: string; prefix: string; hash: string } {
    const key = `nrv_${crypto.randomUUID().replace(/-/g, '')}`;
    const prefix = key.slice(0, 12);
    const hash = hashKey(key);
    return { key, prefix, hash };
}

export async function createApiKey(name: string, permissions: ApiPermission[] = ['read']): Promise<{ id: string; key: string }> {
    const { key, prefix, hash } = generateApiKey();
    const id = crypto.randomUUID();
    await db.from('api_keys').insert({
        id, name,
        key_hash: hash,
        prefix,
        permissions, // jsonb
    });
    return { id, key };
}

export async function getApiKeys(): Promise<Omit<ApiKey, 'key'>[]> {
    const { data } = await db.from('api_keys').select('*').order('created_at', { ascending: false });
    return (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        key: '', // never return actual key
        prefix: row.prefix,
        permissions: row.permissions || ['read'],
        lastUsedAt: row.last_used_at ?? undefined,
        createdAt: row.created_at,
        expiresAt: row.expires_at ?? undefined,
    }));
}

export async function deleteApiKey(id: string): Promise<void> {
    await db.from('api_keys').delete().eq('id', id);
}

export async function validateApiKey(authHeader: string | null): Promise<{ valid: boolean; error?: string }> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { valid: false, error: 'Missing Authorization header' };
    }
    const token = authHeader.replace('Bearer ', '');
    const hash = hashKey(token);
    const { data: row } = await db.from('api_keys').select('*').eq('key_hash', hash).single();
    if (!row) return { valid: false, error: 'Invalid API key' };
    if (row.expires_at && Date.now() > new Date(row.expires_at).getTime()) {
        return { valid: false, error: 'API key expired' };
    }
    // Update last used
    await db.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', row.id);
    return { valid: true };
}

export function withAuth(handler: (request: Request) => Promise<NextResponse>) {
    return async (request: Request) => {
        const { valid, error } = await validateApiKey(request.headers.get('authorization'));
        if (!valid) {
            return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
        }
        return handler(request);
    };
}
