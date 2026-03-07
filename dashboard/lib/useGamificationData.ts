import { useMemo, useEffect, useRef } from 'react';
import { useTaskStore } from '@/lib/useTaskStore';

export interface GamificationData {
    agentMastery: Record<string, {
        completedTasks: number;
        failedTasks: number;
        totalTasks: number;
    }>;
    streak: {
        currentStreak: number;
        longestStreak: number;
        todayComplete: boolean;
        last7Days: boolean[];
    };
    recentAchievements: string[];
}

const shownAchievements = new Set<string>();

export function useGamificationData(): GamificationData {
    // Read-only access to task store
    const tasks = useTaskStore(state => state.tasks);

    // We keep track of previous recent achievements to return a stable reference if nothing changed
    // But useMemo will handle recalculation when tasks change.

    return useMemo(() => {
        // 1. Calculate Agent Mastery
        const agentMastery: GamificationData['agentMastery'] = {};

        tasks.forEach(task => {
            const { agentId, status } = task;
            if (!agentMastery[agentId]) {
                agentMastery[agentId] = {
                    completedTasks: 0,
                    failedTasks: 0,
                    totalTasks: 0,
                };
            }

            agentMastery[agentId].totalTasks += 1;

            if (status === 'DONE') {
                agentMastery[agentId].completedTasks += 1;
            } else if (status === 'FAILED') {
                agentMastery[agentId].failedTasks += 1;
            }
        });

        // 2. Calculate Streak
        // Real implementation would index by date using task.updatedAt (or createdAt)
        // For now, we stub this out or do a basic calculation
        const currentStreak = 0;
        const longestStreak = 0;
        const todayComplete = false;
        const last7Days = [false, false, false, false, false, false, false];

        // 3. Calculate Achievements
        const recentAchievements: string[] = [];

        // Check 'first-blood'
        const totalCompleted = tasks.filter(t => t.status === 'DONE').length;
        if (totalCompleted >= 1 && !shownAchievements.has('first-blood')) {
            recentAchievements.push('first-blood');
            shownAchievements.add('first-blood');
        }

        // Check 'centurion'
        for (const [agentId, stats] of Object.entries(agentMastery)) {
            if (stats.completedTasks >= 100 && !shownAchievements.has('centurion')) {
                recentAchievements.push('centurion');
                shownAchievements.add('centurion');
                break; // Show once per trigger or use unique id like `centurion-${agentId}`
            }
        }

        // TODO: Add other achievement checks (night-owl, flawless-execution, etc.)
        // Note: Due to limitations of the current store structure (e.g. lack of batching info,
        // exact timings for "speed-demon", etc), some logic remains mocked or simplified.

        return {
            agentMastery,
            streak: {
                currentStreak,
                longestStreak,
                todayComplete,
                last7Days,
            },
            recentAchievements,
        };
    }, [tasks]);
}
