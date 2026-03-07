import { NextResponse } from 'next/server';
import { getAllAgentXP, getFleetPowerScore } from '@/lib/gamification/xpEngine';

export async function GET() {
    try {
        const agents = await getAllAgentXP();
        const fleetPowerScore = await getFleetPowerScore();

        return NextResponse.json({ agents, fleetPowerScore });
    } catch (error) {
        console.error('Error fetching XP:', error);
        return NextResponse.json({ error: 'Failed to fetch XP' }, { status: 500 });
    }
}
