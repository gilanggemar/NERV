export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    color: string;
}

export const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'first-blood',
        title: 'First Blood',
        description: 'First task completed after system boot',
        icon: 'Zap',
        rarity: 'common',
        color: 'var(--accent-base)',
    },
    {
        id: 'flawless-execution',
        title: 'Flawless Execution',
        description: 'All tasks in a batch completed without errors',
        icon: 'CheckCircle2',
        rarity: 'rare',
        color: 'var(--accent-lime)',
    },
    {
        id: 'consensus-reached',
        title: 'Consensus Reached',
        description: 'Summit achieved unanimous agent agreement',
        icon: 'Handshake',
        rarity: 'epic',
        color: 'var(--accent-violet)',
    },
    {
        id: 'speed-demon',
        title: 'Speed Demon',
        description: 'Task completed in under estimated time',
        icon: 'Gauge',
        rarity: 'common',
        color: 'var(--accent-teal)',
    },
    {
        id: 'streak-7',
        title: 'On Fire',
        description: '7-day operations streak achieved',
        icon: 'Flame',
        rarity: 'rare',
        color: 'var(--accent-base)',
    },
    {
        id: 'streak-30',
        title: 'Unstoppable',
        description: '30-day operations streak achieved',
        icon: 'Trophy',
        rarity: 'epic',
        color: 'var(--accent-base)',
    },
    {
        id: 'multi-agent-sync',
        title: 'Synchronized',
        description: 'All agents completed their tasks within the same hour',
        icon: 'Radio',
        rarity: 'rare',
        color: 'var(--accent-teal)',
    },
    {
        id: 'night-owl',
        title: 'Night Owl',
        description: 'Task completed between midnight and 5 AM',
        icon: 'Moon',
        rarity: 'common',
        color: 'var(--accent-violet)',
    },
    {
        id: 'centurion',
        title: 'Centurion',
        description: 'An agent has completed 100 tasks',
        icon: 'Shield',
        rarity: 'epic',
        color: 'var(--accent-coral)',
    },
    {
        id: 'architect-achieved',
        title: 'Grand Architect',
        description: 'An agent reached Architect mastery level',
        icon: 'Sparkles',
        rarity: 'legendary',
        color: 'var(--accent-violet)',
    },
];

export function getAchievementById(id: string): Achievement | undefined {
    return ACHIEVEMENTS.find(a => a.id === id);
}

export function getRarityLabel(rarity: Achievement['rarity']): string {
    switch (rarity) {
        case 'common': return '⚡ Common';
        case 'rare': return '💎 Rare';
        case 'epic': return '🔥 Epic';
        case 'legendary': return '👑 Legendary';
        default: return '⚡ Common';
    }
}
