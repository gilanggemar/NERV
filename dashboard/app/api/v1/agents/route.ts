import { NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api/auth';
import { getAuthUserId } from '@/lib/auth';

// GET /api/v1/agents — list all agents
export async function GET(request: Request) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    const { valid, error } = await validateApiKey(request.headers.get('authorization'));
    if (!valid) return NextResponse.json({ error }, { status: 401 });

    try {
        // Return agent data from config / store
        const agents = [
            { id: 'daisy', name: 'Daisy', role: 'General Purpose', status: 'IDLE' },
            { id: 'ivy', name: 'Ivy', role: 'Research & Analysis', status: 'IDLE' },
            { id: 'celia', name: 'Celia', role: 'Code Generation', status: 'IDLE' },
            { id: 'thalia', name: 'Thalia', role: 'Creative Writing', status: 'IDLE' },
        ];
        return NextResponse.json({ agents });
    } catch (error: unknown) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
