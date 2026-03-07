import { NextResponse } from 'next/server';
import { getUnlockedAchievements, getLockedAchievements } from '@/lib/gamification/achievementChecker';
import { seedGamification } from '@/lib/gamification/seed';
import { getAuthUserId } from '@/lib/auth';


export async function GET() {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        await seedGamification(userId);
        const unlocked = await getUnlockedAchievements(userId);
        const locked = await getLockedAchievements(userId);

        return NextResponse.json({ unlocked, locked });
    } catch (error) {
        console.error('Error fetching achievements:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
