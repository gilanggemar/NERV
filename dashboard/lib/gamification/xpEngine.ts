import { db } from '@/lib/db';
import { XP_REWARDS } from './xpRules';
import { checkAllAchievements } from './achievementChecker';

export function calculateLevel(totalXp: number): { level: number; currentLevelXp: number; xpToNextLevel: number; rank: string } {
    let level = 1;
    let currentLevelXp = 0;
    let accumulatedXpForNext = 100;

    while (totalXp >= currentLevelXp + accumulatedXpForNext) {
        currentLevelXp += accumulatedXpForNext;
        level++;
        accumulatedXpForNext = Math.floor(100 * Math.pow(1.15, level - 1));
    }

    let rank = 'INITIATE';
    if (level >= 15) rank = 'APEX';
    else if (level >= 10) rank = 'COMMANDER';
    else if (level >= 6) rank = 'SPECIALIST';
    else if (level >= 3) rank = 'OPERATIVE';

    return {
        level,
        currentLevelXp: totalXp - currentLevelXp,
        xpToNextLevel: accumulatedXpForNext,
        rank
    };
}

export async function awardXP(agentId: string, userId: string, amount: number, reason: string, sourceId?: string) {
    if (!agentId || amount <= 0 || !userId) return;

    try {
        const { data: existing } = await db.from('agent_xp').select('*').eq('user_id', userId).eq('agent_id', agentId).single();

        let newTotalXp = amount;
        if (existing) {
            newTotalXp = existing.total_xp + amount;
        }

        const { level, xpToNextLevel, rank } = calculateLevel(newTotalXp);

        if (existing) {
            await db.from('agent_xp').update({
                total_xp: newTotalXp,
                level,
                xp_to_next_level: xpToNextLevel,
                rank,
                updated_at: new Date().toISOString(),
            }).eq('user_id', userId).eq('agent_id', agentId);
        } else {
            await db.from('agent_xp').insert({
                user_id: userId,
                agent_id: agentId,
                total_xp: newTotalXp,
                level,
                xp_to_next_level: xpToNextLevel,
                rank,
                updated_at: new Date().toISOString(),
            });
        }

        await db.from('xp_events').insert({
            user_id: userId,
            agent_id: agentId,
            amount,
            reason,
            source_id: sourceId || null,
        });

        await checkAllAchievements(userId);

    } catch (error) {
        console.error('Failed to award XP:', error);
    }
}

export async function getAgentXP(agentId: string, userId: string) {
    const { data } = await db.from('agent_xp').select('*').eq('user_id', userId).eq('agent_id', agentId).single();
    return data;
}

export async function getAllAgentXP(userId: string) {
    const { data } = await db.from('agent_xp').select('*').eq('user_id', userId);
    return data || [];
}

export async function getFleetPowerScore(userId: string) {
    const allXp = await getAllAgentXP(userId);
    return allXp.reduce((acc: number, curr: any) => acc + curr.total_xp, 0);
}
