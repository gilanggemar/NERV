'use client';

import { useEffect, useState, useCallback } from 'react';

const bgCache: Record<string, string | null> = {};

// Optional global map to ensure we only prefetch once per agent
const prefetchInProgress: Record<string, boolean> = {};

export async function prefetchAgentBackground(agentId: string) {
    if (!agentId || bgCache[agentId] !== undefined || prefetchInProgress[agentId]) return;
    prefetchInProgress[agentId] = true;
    try {
        const res = await fetch(`/api/agents/background?agentId=${agentId}`);
        const data = await res.json();
        bgCache[agentId] = data.backgroundImage || null;
    } catch (err) {
        console.error('Failed to prefetch background:', err);
    } finally {
        prefetchInProgress[agentId] = false;
    }
}

export function useAgentBackground(agentId: string) {
    const [backgroundUri, setBackgroundUri] = useState<string | null>(bgCache[agentId] ?? null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchBackground = useCallback(async () => {
        if (!agentId) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/agents/background?agentId=${agentId}`);
            const data = await res.json();
            const bg = data.backgroundImage || null;
            bgCache[agentId] = bg;
            setBackgroundUri(bg);
        } catch (err) {
            console.error('Failed to load agent background:', err);
        } finally {
            setIsLoading(false);
        }
    }, [agentId]);

    useEffect(() => {
        if (bgCache[agentId] !== undefined) {
            setBackgroundUri(bgCache[agentId]);
        } else {
            // Immediately clear so the old agent's image doesn't linger
            setBackgroundUri(null);
            fetchBackground();
        }
    }, [agentId, fetchBackground]);

    const invalidate = useCallback(() => {
        delete bgCache[agentId];
        fetchBackground();
    }, [agentId, fetchBackground]);

    return { backgroundUri, isLoading, invalidate };
}
