'use client';

import { useState, useEffect } from 'react';
import { useSocketStore } from '@/lib/useSocket';
import { useGamificationStore } from '@/store/useGamificationStore';
import { useAvailableAgents } from '@/hooks/useAvailableAgents';

export function useCommandCenter() {
    const availableAgents = useAvailableAgents();
    const [activeAgentId, setActiveAgentId] = useState<string>('');
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

    // Auto-select first agent if none is selected, or if the selected one disconnects
    useEffect(() => {
        if (availableAgents.length > 0) {
            if (!activeAgentId || !availableAgents.find((a: any) => a.id === activeAgentId)) {
                setActiveAgentId(availableAgents[0].id);
            }
        } else {
            setActiveAgentId('');
        }
    }, [availableAgents.length, activeAgentId]); // depend on length to catch additions

    const activeAgent = availableAgents.find((a: any) => a.id === activeAgentId) || null;

    // Provide default XP values if agent is found but no XP data exists yet
    const activeAgentXp = activeAgent && agentXP[activeAgent.id]
        ? agentXP[activeAgent.id]
        : { level: 1, totalXp: 0, xpToNextLevel: 100, rank: 'INITIATE' };

    return {
        isMounted,
        activeAgent,
        activeAgentXp,
        fleetPowerScore,
        currentStreak,
        setActiveAgentId,
        availableAgents
    };
}
