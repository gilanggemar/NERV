import { NextResponse } from 'next/server';
import { updateBridge, deleteBridge, toggleAgentAssigned } from '@/lib/bridges/engine';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();
        if (body.toggleAgent) {
            await toggleAgentAssigned(id, body.toggleAgent);
        } else {
            await updateBridge(id, body);
        }
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await deleteBridge(id);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
