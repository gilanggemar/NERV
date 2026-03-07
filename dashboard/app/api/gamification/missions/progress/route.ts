import { NextResponse } from 'next/server';
import { updateMissionProgress } from '@/lib/gamification/missionGenerator';

export async function POST(req: Request) {
    try {
        const { type, increment = 1 } = await req.json();
        if (!type) {
            return NextResponse.json({ error: 'Missing type' }, { status: 400 });
        }
        await updateMissionProgress(type, increment);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating mission progress:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
