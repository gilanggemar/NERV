import { useGamificationStore } from '@/store/useGamificationStore';
import { useTaskStore } from '@/store/useTaskStore';
import { useAgentStore } from '@/store/useAgentStore';
import { useMemo } from 'react';

export function useOverviewData() {
    const gamification = useGamificationStore();
    const { tasks } = useTaskStore();
    const { agents } = useAgentStore();

    // Compute Today's Metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    const tasksList = Object.values(tasks);
    const activeTasks = tasksList.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
    const completedToday = tasksList.filter(t => t.status === 'DONE' && t.updatedAt >= todayMs).length;

    // Success rate (all time)
    const completedTotal = tasksList.filter(t => t.status === 'DONE').length;
    const failedTotal = tasksList.filter(t => t.status === 'FAILED').length;
    const totalFinished = completedTotal + failedTotal;
    const successRate = totalFinished > 0 ? Math.round((completedTotal / totalFinished) * 100) : 0;

    // Agents Online (For simplicity, treat all managed agents as "online" in default locally hosted state)
    // You could refine this by checking socket connections
    const agentsOnline = Object.keys(agents).length;

    // Recent completions
    const recentCompletions = tasksList
        .filter(t => t.status === 'DONE')
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 5);

    return {
        fleetPowerScore: gamification.fleetPowerScore,
        metrics: {
            activeTasks,
            completedToday,
            successRate,
            agentsOnline
        },
        streak: {
            current: gamification.currentStreak,
            longest: gamification.longestStreak,
            history: gamification.streakHistory
        },
        missions: {
            list: gamification.dailyMissions,
            allCompleted: gamification.allMissionsCompleted
        },
        achievements: {
            unlocked: gamification.unlockedAchievements,
            recent: gamification.recentUnlock
        },
        recentCompletions,
        agentXPData: gamification.agentXP
    };
}
