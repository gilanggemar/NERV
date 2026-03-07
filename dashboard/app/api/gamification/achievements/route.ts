import { NextResponse } from 'next/server';
import { getUnlockedAchievements, getLockedAchievements } from '@/lib/gamification/achievementChecker';
import { seedGamification } from '@/lib/gamification/seed';

export async function GET() {
    try {
        await seedGamification();
        const unlocked = await getUnlockedAchievements();
        const locked = await getLockedAchievements();

        return NextResponse.json({ unlocked, locked });
    } catch (error) {
        console.error('Error fetching achievements:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
