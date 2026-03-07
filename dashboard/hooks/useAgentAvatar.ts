'use client';

import { useEffect, useState, useCallback } from 'react';

const avatarCache: Record<string, string | null> = {};

/**
 * Invalidate the avatar cache for a specific agent or all agents
 */
export function invalidateAvatarCache(agentId?: string) {
    if (agentId) {
        delete avatarCache[agentId];
    } else {
        Object.keys(avatarCache).forEach(key => delete avatarCache[key]);
    }
}

export function useAgentAvatar(agentId: string) {
    const [avatarUri, setAvatarUri] = useState<string | null>(avatarCache[agentId] || null);

    const fetchAvatar = useCallback(async () => {
        if (!agentId) return;
        try {
            const res = await fetch(`/api/agents/avatar?agentId=${agentId}`);
            const data = await res.json();
            if (data && data.avatar) {
                avatarCache[agentId] = data.avatar;
                setAvatarUri(data.avatar);
            } else {
                avatarCache[agentId] = null;
                setAvatarUri(null);
            }
        } catch (err) {
            console.error('Failed to load avatar:', err);
            avatarCache[agentId] = null;
        }
    }, [agentId]);

    useEffect(() => {
        if (!agentId) return;
        if (avatarCache[agentId] !== undefined) {
            setAvatarUri(avatarCache[agentId]);
            return;
        }
        fetchAvatar();
    }, [agentId, fetchAvatar]);

    const invalidate = useCallback(() => {
        invalidateAvatarCache(agentId);
        fetchAvatar();
    }, [agentId, fetchAvatar]);

    return { avatarUri, invalidate };
}
