import { create } from 'zustand';

interface AgentXPData {
    agentId: string;
    totalXp: number;
    level: number;
    xpToNextLevel: number;
    rank: string;
}

interface DailyMission {
    id: string;
    date: string;
    title: string;
    type: string;
    target: number;
    current: number;
    xpReward: number;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    isCompleted: boolean | number; // SQLite might return 0/1 depending on parser OR boolean
}

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    xpReward: number;
    rarity: string;
    unlockedAt?: string;
    agentId?: string;
}

interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string | null;
    streakHistory: string; // JSON
}

interface GamificationState {
    agentXP: Record<string, AgentXPData>;
    fleetPowerScore: number;
    dailyMissions: DailyMission[];
    allMissionsCompleted: boolean;
    unlockedAchievements: Achievement[];
    lockedAchievements: Achievement[];
    recentUnlock: Achievement | null;
    currentStreak: number;
    longestStreak: number;
    streakHistory: { date: string; active: boolean }[];

    fetchAll: () => Promise<void>;
    awardXP: (agentId: string, amount: number, reason: string, sourceId?: string) => Promise<void>;
    refreshMissions: () => Promise<void>;
    updateMissionProgress: (type: string, increment?: number) => Promise<void>;
    checkStreak: () => Promise<void>;
    dismissRecentUnlock: () => void;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
    agentXP: {},
    fleetPowerScore: 0,
    dailyMissions: [],
    allMissionsCompleted: false,
    unlockedAchievements: [],
    lockedAchievements: [],
    recentUnlock: null,
    currentStreak: 0,
    longestStreak: 0,
    streakHistory: [],

    fetchAll: async () => {
        try {
            // Parallel fetches for speed
            const [xpRes, missionsRes, achRes, streakRes] = await Promise.all([
                fetch('/api/gamification/xp').then(r => r.json()),
                fetch('/api/gamification/missions').then(r => r.json()),
                fetch('/api/gamification/achievements').then(r => r.json()),
                fetch('/api/gamification/streak/check', { method: 'POST' }).then(r => r.json()) // Check streak daily init
            ]);

            const xpMap: Record<string, AgentXPData> = {};
            if (xpRes.agents) {
                xpRes.agents.forEach((a: AgentXPData) => {
                    xpMap[a.agentId] = a;
                });
            }

            set({
                agentXP: xpMap,
                fleetPowerScore: xpRes.fleetPowerScore || 0,
                dailyMissions: missionsRes.missions || [],
                allMissionsCompleted: missionsRes.allCompleted || false,
                unlockedAchievements: achRes.unlocked || [],
                lockedAchievements: achRes.locked || [],
                currentStreak: streakRes.currentStreak || 0,
                longestStreak: streakRes.longestStreak || 0,
                streakHistory: streakRes.streakHistory ? JSON.parse(streakRes.streakHistory) : [],
            });
        } catch (e) {
            console.error("Failed to load gamification data", e);
        }
    },

    awardXP: async (agentId, amount, reason, sourceId) => {
        try {
            await fetch('/api/gamification/xp/award', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId, amount, reason, sourceId })
            });
            get().fetchAll(); // Re-sync state
        } catch (e) {
            console.error(e);
        }
    },

    refreshMissions: async () => {
        try {
            const res = await fetch('/api/gamification/missions').then(r => r.json());
            set({
                dailyMissions: res.missions || [],
                allMissionsCompleted: res.allCompleted || false,
            });
        } catch (e) {
            console.error(e);
        }
    },

    updateMissionProgress: async (type, increment = 1) => {
        try {
            await fetch('/api/gamification/missions/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, increment })
            });
            get().refreshMissions();
            // Need to re-fetch XP and achievements inside refresh theoretically, but let's just do fetchAll
            get().fetchAll();
        } catch (e) {
            console.error(e);
        }
    },

    checkStreak: async () => {
        try {
            await fetch('/api/gamification/streak/check', { method: 'POST' });
            get().fetchAll();
        } catch (e) {
            console.error(e);
        }
    },

    dismissRecentUnlock: () => set({ recentUnlock: null })
}));
