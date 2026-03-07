import { NextResponse } from 'next/server';
import { generateDailyMissions } from '@/lib/gamification/missionGenerator';

export async function GET() {
    try {
        const missions = await generateDailyMissions();
        const allCompleted = missions.every(m => m.isCompleted);

        // getTodayStr is from generator, we can just grab date from first mission
        const date = missions[0]?.date || new Date().toISOString().split('T')[0];

        return NextResponse.json({ date, missions, allCompleted });
    } catch (error) {
        console.error('Error fetching missions:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
