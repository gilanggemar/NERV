'use client';

import { useAgentAvatar } from '@/hooks/useAgentAvatar';

interface AgentAvatarProps {
    agentId: string;
    name?: string;
    size?: number;
    width?: number;
    height?: number;
    className?: string;
    showStatus?: boolean;
    isOnline?: boolean;
}

export function AgentAvatar({ agentId, name = '', size = 32, width, height, className = '', showStatus = false, isOnline = false }: AgentAvatarProps) {
    const { avatarUri: avatar } = useAgentAvatar(agentId);
    const initials = (name || agentId).slice(0, 2).toUpperCase();

    return (
        <div className={`relative inline-flex bg-accent/30 border border-border items-center justify-center shrink-0 ${className}`} style={{ width: width || size, height: height || size, borderRadius: '8px' }}>
            {avatar ? (
                <img src={avatar} alt={name || agentId} className="w-full h-full object-cover" style={{ borderRadius: '8px' }} />
            ) : (
                <span style={{ fontSize: Math.min(width || size, height || size) * 0.38, fontWeight: 600, color: 'var(--accent-base)' }}>
                    {initials}
                </span>
            )}

            {showStatus && (
                <div
                    className={`absolute bottom-0 right-0 rounded-full border-2 border-background`}
                    style={{
                        width: size * 0.28,
                        height: size * 0.28,
                        backgroundColor: isOnline ? 'var(--status-online)' : 'var(--status-offline)'
                    }}
                />
            )}
        </div>
    );
}
