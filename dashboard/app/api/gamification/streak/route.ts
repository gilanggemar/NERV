import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

export async function GET() {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        const { data: streak } = await db.from('operations_streak').select('*').eq('user_id', userId).limit(1).single();

        if (!streak) {
            const { data: newStreak } = await db.from('operations_streak').insert({ user_id: userId,
                current_streak: 0,
                longest_streak: 0,
                last_active_date: null,
                streak_history: [],
            }).select().single();
            return NextResponse.json(newStreak);
        }

        return NextResponse.json(streak);
    } catch (error) {
        console.error('Error fetching streak:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
