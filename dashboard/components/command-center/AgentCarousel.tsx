'use client';

import { motion } from 'framer-motion';
import { AGENT_ROSTER, type AgentProfile } from '@/lib/agentRoster';
import { useAgentAvatar } from '@/hooks/useAgentAvatar';

interface AgentCarouselProps {
    activeAgentId: string;
    onSelectAgent: (id: string) => void;
}

function CarouselItem({
    agent,
    isActive,
    onSelect
}: {
    agent: AgentProfile,
    isActive: boolean,
    onSelect: () => void
}) {
    const { avatarUri } = useAgentAvatar(agent.id);

    return (
        <motion.div
            onClick={onSelect}
            className={`relative flex flex-col items-center cursor-pointer transition-all duration-300 group ${isActive ? 'scale-110' : 'scale-90 opacity-60 hover:opacity-100 hover:scale-100'}`}
        >
            <div
                className="w-11 h-11 rounded-full bg-cover bg-center border-2 transition-all duration-300"
                style={{
                    backgroundImage: avatarUri ? `url(${avatarUri})` : 'none',
                    borderColor: isActive ? agent.colorHex : 'transparent',
                    boxShadow: isActive ? `0 0 14px ${agent.colorHex}60` : '0 0 10px rgba(0,0,0,0.4)'
                }}
            />
        </motion.div>
    );
}

export function AgentCarousel({ activeAgentId, onSelectAgent }: AgentCarouselProps) {
    return (
        <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-white/10"
            style={{ background: '#151311' }}
        >
            {AGENT_ROSTER.map((agent) => (
                <CarouselItem
                    key={agent.id}
                    agent={agent}
                    isActive={agent.id === activeAgentId}
                    onSelect={() => onSelectAgent(agent.id)}
                />
            ))}
        </div>
    );
}
