import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { awardXP } from '@/lib/gamification/xpEngine';
import { getAuthUserId } from '@/lib/auth';

function getTodayStr() {
    const d = new Date();
    return d.toISOString().split('T')[0];
}

export async function POST() {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    try {
        let { data: streak } = await db.from('operations_streak').select('*').eq('user_id', userId).limit(1).single();
        if (!streak) {
            const { data: newStreak } = await db.from('operations_streak').insert({
                user_id: userId,
                current_streak: 0,
                longest_streak: 0,
                last_active_date: null,
                streak_history: [],
            }).select().single();
            streak = newStreak;
        }

        if (!streak) throw new Error('Could not init streak');

        const today = getTodayStr();

        if (streak.last_active_date === today) {
            return NextResponse.json({ streak, unchanged: true });
        }

        let newStreak = streak.current_streak;
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

        if (streak.last_active_date === yesterdayStr) {
            newStreak += 1;
        } else {
            // Missed a day or first time
            newStreak = 1;
        }

        // streak_history is already a JS object from jsonb, no JSON.parse needed
        const parsedHistory = Array.isArray(streak.streak_history) ? [...streak.streak_history] : [];
        parsedHistory.push({ date: today, active: true });
        // Keep last 30 days
        if (parsedHistory.length > 30) parsedHistory.shift();

        const longestStreak = Math.max(streak.longest_streak, newStreak);

        await db.from('operations_streak').update({
            current_streak: newStreak,
            longest_streak: longestStreak,
            last_active_date: today,
            streak_history: parsedHistory,
            updated_at: new Date().toISOString(),
        }).eq('user_id', userId).eq('id', streak.id);

        // Award XP
        if (newStreak > 1) {
            let xpTotal = 10;
            if (newStreak === 7) xpTotal += 75;
            if (newStreak === 14) xpTotal += 150;
            if (newStreak === 30) xpTotal += 400;
            if (newStreak === 100) xpTotal += 1500;
            await awardXP('system', userId, xpTotal, `Streak maintained: ${newStreak} days`);
        }

        const { data: updated } = await db.from('operations_streak').select('*').eq('user_id', userId).eq('id', streak.id).single();
        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error checking streak:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
