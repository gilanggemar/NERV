import { NextResponse } from 'next/server';
import { awardXP } from '@/lib/gamification/xpEngine';

export async function POST(req: Request) {
    try {
        const { agentId, amount, reason, sourceId } = await req.json();
        if (!amount || !reason) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        await awardXP(agentId, amount, reason, sourceId);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error awarding XP:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
