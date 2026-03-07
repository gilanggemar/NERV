'use client';

import { useState, useEffect } from 'react';
import { AGENT_ROSTER } from '@/lib/agentRoster';
import { useGamificationStore } from '@/store/useGamificationStore';

export function useCommandCenter() {
    const [activeAgentId, setActiveAgentId] = useState<string>('agent-zero');
    const [isMounted, setIsMounted] = useState(false);

    const {
        agentXP,
        fleetPowerScore,
        currentStreak,
        fetchAll
    } = useGamificationStore();

    useEffect(() => {
        setIsMounted(true);
        // Fetch all gamification data on mount
        fetchAll();

        // Set up polling for gamification updates every 15s
        const statsInterval = setInterval(() => fetchAll(), 15000);
        return () => clearInterval(statsInterval);
    }, [fetchAll]);

    const activeAgent = AGENT_ROSTER.find(a => a.id === activeAgentId) || AGENT_ROSTER[4];
    const activeAgentXp = agentXP[activeAgent.id] || { level: 1, totalXp: 0, xpToNextLevel: 100, rank: 'INITIATE' };

    return {
        isMounted,
        activeAgent,
        activeAgentXp,
        fleetPowerScore,
        currentStreak,
        setActiveAgentId
    };
}
