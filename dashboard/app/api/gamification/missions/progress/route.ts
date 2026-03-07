import { NextResponse } from 'next/server';
import { updateMissionProgress } from '@/lib/gamification/missionGenerator';
import { getAuthUserId } from '@/lib/auth';

export async function POST(req: Request) {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const { type, increment = 1 } = await req.json();
        if (!type) {
            return NextResponse.json({ error: 'Missing type' }, { status: 400 });
        }
        await updateMissionProgress(type, increment, userId);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating mission progress:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
