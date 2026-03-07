import { NextResponse } from 'next/server';
import { createApiKey, getApiKeys, deleteApiKey } from '@/lib/api/auth';

export async function GET() {
    try {
        const keys = await getApiKeys();
        return NextResponse.json(keys);
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name, permissions } = await request.json();
        if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
        const result = await createApiKey(name, permissions);
        return NextResponse.json(result, { status: 201 });
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (id) await deleteApiKey(id);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
