import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        const { data: streak } = await db.from('operations_streak').select('*').limit(1).single();

        if (!streak) {
            const { data: newStreak } = await db.from('operations_streak').insert({
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
