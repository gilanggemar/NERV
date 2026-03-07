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

export async function awardXP(agentId: string, amount: number, reason: string, sourceId?: string) {
    if (!agentId || amount <= 0) return;

    try {
        const { data: existing } = await db.from('agent_xp').select('*').eq('agent_id', agentId).single();

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
            }).eq('agent_id', agentId);
        } else {
            await db.from('agent_xp').insert({
                agent_id: agentId,
                total_xp: newTotalXp,
                level,
                xp_to_next_level: xpToNextLevel,
                rank,
                updated_at: new Date().toISOString(),
            });
        }

        await db.from('xp_events').insert({
            agent_id: agentId,
            amount,
            reason,
            source_id: sourceId || null,
        });

        await checkAllAchievements();

    } catch (error) {
        console.error('Failed to award XP:', error);
    }
}

export async function getAgentXP(agentId: string) {
    const { data } = await db.from('agent_xp').select('*').eq('agent_id', agentId).single();
    return data;
}

export async function getAllAgentXP() {
    const { data } = await db.from('agent_xp').select('*');
    return data || [];
}

export async function getFleetPowerScore() {
    const allXp = await getAllAgentXP();
    return allXp.reduce((acc: number, curr: any) => acc + curr.total_xp, 0);
}
