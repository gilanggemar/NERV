'use client';

import { useEffect, useState } from 'react';

const heroCache: Record<string, string | null> = {};

export function useAgentHero(agentId: string) {
    const [heroUri, setHeroUri] = useState<string | null>(heroCache[agentId] || null);

    useEffect(() => {
        if (!agentId) return;
        if (heroCache[agentId] !== undefined) {
            setHeroUri(heroCache[agentId]);
            return;
        }

        let isMounted = true;
        fetch(`/api/agents/hero?agentId=${agentId}`)
            .then(res => res.json())
            .then(data => {
                if (!isMounted) return;
                if (data && data.heroImage) {
                    heroCache[agentId] = data.heroImage;
                    setHeroUri(data.heroImage);
                } else {
                    heroCache[agentId] = null;
                }
            })
            .catch(err => {
                console.error('Failed to load hero image:', err);
                heroCache[agentId] = null;
            });

        return () => { isMounted = false; };
    }, [agentId]);

    // Allow cache invalidation after upload
    const invalidate = (newUri: string) => {
        heroCache[agentId] = newUri;
        setHeroUri(newUri);
    };

    return { heroUri, invalidate };
}
