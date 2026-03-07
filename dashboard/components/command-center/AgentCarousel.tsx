'use client';

import { motion } from 'framer-motion';
import { useAgentAvatar } from '@/hooks/useAgentAvatar';

// Define a type for the socket agent to ensure type safety in the carousel
export interface SocketAgent {
    id: string;
    name: string;
    colorHex?: string; // Some socket agents might have a color, or we can use a default
}

interface AgentCarouselProps {
    activeAgentId: string;
    availableAgents: SocketAgent[];
    onSelectAgent: (id: string) => void;
}

function CarouselItem({
    agent,
    isActive,
    onSelect
}: {
    agent: SocketAgent,
    isActive: boolean,
    onSelect: () => void
}) {
    const { avatarUri } = useAgentAvatar(agent.id);
    // Use a default orange NERV color if the socket agent doesn't provide a hex code
    const badgeColor = agent.colorHex || '#FF6B00';

    return (
        <motion.div
            onClick={onSelect}
            className={`relative flex flex-col items-center cursor-pointer transition-all duration-300 group ${isActive ? 'scale-110' : 'scale-90 opacity-60 hover:opacity-100 hover:scale-100'}`}
            title={agent.name}
        >
            <div
                className="w-11 h-11 rounded-full bg-cover bg-center border-2 transition-all duration-300"
                style={{
                    backgroundImage: avatarUri ? `url(${avatarUri})` : 'none',
                    backgroundColor: avatarUri ? 'transparent' : '#222',
                    borderColor: isActive ? badgeColor : 'transparent',
                    boxShadow: isActive ? `0 0 14px ${badgeColor}60` : '0 0 10px rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: 'rgba(255,255,255,0.7)',
                }}
            >
                {!avatarUri && agent.name.substring(0, 2).toUpperCase()}
            </div>
        </motion.div>
    );
}

export function AgentCarousel({ activeAgentId, availableAgents, onSelectAgent }: AgentCarouselProps) {
    if (!availableAgents || availableAgents.length === 0) {
        return null;
    }

    return (
        <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-white/10"
            style={{ background: '#151311' }}
        >
            {availableAgents.map((agent) => (
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
