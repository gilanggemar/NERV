import { db } from '@/lib/db';
import { ACHIEVEMENT_DEFINITIONS } from './achievementChecker';
import { AGENT_ROSTER } from '../agentRoster';
import { calculateLevel } from './xpEngine';

export async function seedGamification() {
    console.log('--- GAMIFICATION SEED CHECK ---');
    try {
        // 1. Seed Achievements
        const { data: existingAchievements } = await db.from('achievements').select('id');
        if (!existingAchievements || existingAchievements.length === 0) {
            console.log('Seeding achievements...');
            await db.from('achievements').insert(ACHIEVEMENT_DEFINITIONS);
        } else {
            console.log('Achievements already seeded.');
        }

        // 2. Initialize Agent XP
        for (const agent of AGENT_ROSTER) {
            const { data: existingXp } = await db.from('agent_xp').select('agent_id').eq('agent_id', agent.id).single();
            if (!existingXp) {
                console.log(`Initializing XP for agent ${agent.id}...`);
                const { level, xpToNextLevel, rank } = calculateLevel(0);
                await db.from('agent_xp').insert({
                    agent_id: agent.id,
                    total_xp: 0,
                    level,
                    xp_to_next_level: xpToNextLevel,
                    rank,
                    updated_at: new Date().toISOString(),
                });
            }
        }

        // 3. Initialize Operations Streak singleton
        const { data: existingStreak } = await db.from('operations_streak').select('id').limit(1);
        if (!existingStreak || existingStreak.length === 0) {
            console.log('Initializing operations streak...');
            await db.from('operations_streak').insert({
                current_streak: 0,
                longest_streak: 0,
                last_active_date: null,
                streak_history: [],
                updated_at: new Date().toISOString(),
            });
        } else {
            console.log('Operations streak already initialized.');
        }

        console.log('--- GAMIFICATION SEED COMPLETE ---');
    } catch (error) {
        console.error('Gamification seed failed:', error);
    }
}
