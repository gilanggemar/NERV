import { db } from '@/lib/db';
import { awardXP } from './xpEngine';
import { v4 as uuidv4 } from 'uuid';
import { checkAllAchievements } from './achievementChecker';

const MISSION_TEMPLATES = [
    {
        type: 'task_count',
        titleTemplate: 'Complete {target} agent tasks',
        baseDifficulty: 'EASY',
        baseTarget: 3,
        baseXP: 30,
    },
    {
        type: 'success_rate',
        titleTemplate: 'Maintain {target}% success rate',
        baseDifficulty: 'MEDIUM',
        baseTarget: 90,
        baseXP: 50,
    },
    {
        type: 'summit',
        titleTemplate: 'Run a Summit deliberation',
        baseDifficulty: 'MEDIUM',
        baseTarget: 1,
        baseXP: 50,
    },
    {
        type: 'streak',
        titleTemplate: 'Maintain your operations streak',
        baseDifficulty: 'EASY',
        baseTarget: 1,
        baseXP: 25,
    },
    {
        type: 'audit',
        titleTemplate: 'Review {target} audit log entries',
        baseDifficulty: 'EASY',
        baseTarget: 5,
        baseXP: 20,
    },
    {
        type: 'workflow',
        titleTemplate: 'Execute a workflow run',
        baseDifficulty: 'HARD',
        baseTarget: 1,
        baseXP: 75,
    },
    {
        type: 'multi_agent',
        titleTemplate: 'Use {target} different agents',
        baseDifficulty: 'MEDIUM',
        baseTarget: 2,
        baseXP: 40,
    },
    {
        type: 'tools',
        titleTemplate: 'Trigger {target} tool calls',
        baseDifficulty: 'MEDIUM',
        baseTarget: 5,
        baseXP: 45,
    },
];

function getTodayString(date?: string) {
    if (date) return date;
    return new Date().toISOString().split('T')[0];
}

export async function generateDailyMissions(userId: string, date?: string) {
    const today = getTodayString(date);

    const { data: existingMissions } = await db.from('daily_missions').select('*').eq('user_id', userId).eq('date', today);
    if (existingMissions && existingMissions.length > 0) {
        return existingMissions;
    }

    // Shuffle and pick 4
    const shuffled = [...MISSION_TEMPLATES].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 4);

    const newMissions = selected.map(template => ({
        id: uuidv4(),
        user_id: userId,
        date: today,
        title: template.titleTemplate.replace('{target}', String(template.baseTarget)),
        description: '',
        type: template.type,
        target: template.baseTarget,
        current: 0,
        xp_reward: template.baseXP,
        difficulty: template.baseDifficulty,
        is_completed: false,
    }));

    await db.from('daily_missions').insert(newMissions);
    return newMissions;
}

export async function checkMissionCompletion(missionId: string, userId: string) {
    const { data: mission } = await db.from('daily_missions').select('*').eq('id', missionId).single();
    if (!mission || mission.is_completed) return;

    if (mission.current >= mission.target) {
        await db.from('daily_missions').update({
            is_completed: true,
            completed_at: new Date().toISOString(),
        }).eq('id', missionId).eq('user_id', userId);

        // Award global XP
        await awardXP('agent-zero', userId, mission.xp_reward, 'mission_completed', mission.id);

        // Check if all missions for today are complete
        const today = mission.date;
        const { data: allToday } = await db.from('daily_missions').select('*').eq('user_id', userId).eq('date', today);
        if (allToday && allToday.every((m: any) => m.is_completed || m.id === missionId)) {
            await awardXP('agent-zero', userId, 75, 'all_missions_completed');
        }

        await checkAllAchievements(userId);
    }
}

export async function updateMissionProgress(type: string, increment: number, userId: string) {
    const today = getTodayString();
    const { data: missions } = await db.from('daily_missions')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .eq('type', type)
        .eq('is_completed', false);

    for (const mission of (missions || [])) {
        const newCurrent = mission.current + increment;
        await db.from('daily_missions').update({ current: newCurrent }).eq('id', mission.id).eq('user_id', userId);
        if (newCurrent >= mission.target) {
            await checkMissionCompletion(mission.id, userId);
        }
    }
}
