import { NextResponse } from 'next/server';
import { generateDailyMissions } from '@/lib/gamification/missionGenerator';
import { getAuthUserId } from '@/lib/auth';

export async function GET() {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const missions = await generateDailyMissions(userId);
        const allCompleted = missions.every((m: any) => m.isCompleted);

        // getTodayStr is from generator, we can just grab date from first mission
        const date = missions[0]?.date || new Date().toISOString().split('T')[0];

        return NextResponse.json({ date, missions, allCompleted });
    } catch (error) {
        console.error('Error fetching missions:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
