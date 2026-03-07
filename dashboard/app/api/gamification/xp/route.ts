import { NextResponse } from 'next/server';
import { getAllAgentXP, getFleetPowerScore } from '@/lib/gamification/xpEngine';
import { getAuthUserId } from '@/lib/auth';

export async function GET() {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const agents = await getAllAgentXP(userId);
        const fleetPowerScore = await getFleetPowerScore(userId);

        return NextResponse.json({ agents, fleetPowerScore });
    } catch (error) {
        console.error('Error fetching XP:', error);
        return NextResponse.json({ error: 'Failed to fetch XP' }, { status: 500 });
    }
}
