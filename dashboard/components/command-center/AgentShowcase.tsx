'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { AgentProfile } from '@/lib/agentRoster';
import { useAgentAvatar } from '@/hooks/useAgentAvatar';
import { useAgentHeroGallery } from '@/hooks/useAgentHeroGallery';
import { AgentHeroPortrait } from '@/components/agent-showcase/AgentHeroPortrait';
import { AgentIdentityPlate } from '@/components/agent-showcase/AgentIdentityPlate';
import { AgentStatBlock } from '@/components/agent-showcase/AgentStatBlock';

interface AgentShowcaseProps {
    agentProfile: AgentProfile;
    level: number;
    currentXp: number;
    xpToNext: number;
    rank: string;
    currentStreak: number;
}

const columnVariants = {
    initial: { opacity: 0, y: 20, filter: 'blur(8px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, y: -10, filter: 'blur(8px)' },
};

const transition = (delay: number) => ({
    duration: 0.6,
    delay,
    ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
});

export function AgentShowcase({ agentProfile, level, currentXp, xpToNext, rank, currentStreak }: AgentShowcaseProps) {
    const { avatarUri } = useAgentAvatar(agentProfile.id);
    const {
        images, activeIndex, activeImage, imageCount,
        next, prev, setActiveIndex, invalidate,
    } = useAgentHeroGallery(agentProfile.id);

    return (
        <div className="w-full h-full z-20 pointer-events-none flex" style={{ gap: 0 }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={agentProfile.id}
                    className="flex w-full h-full"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    style={{ gap: 0 }}
                >
                    {/* LEFT COLUMN — Identity + Directives (padded to match sidebar) */}
                    <motion.div
                        className="w-[280px] flex-shrink-0 pointer-events-auto z-30 p-2"
                        variants={columnVariants}
                        transition={transition(0)}
                    >
                        <div className="h-full cc-glass-panel overflow-hidden">
                            <AgentIdentityPlate
                                agent={agentProfile}
                                level={level}
                                currentXp={currentXp}
                                xpToNext={xpToNext}
                                rank={rank}
                                currentStreak={currentStreak}
                            />
                        </div>
                    </motion.div>

                    {/* CENTER COLUMN — Hero Portrait (no container, edge-to-edge) */}
                    <motion.div
                        className="flex-1 min-w-0 h-full pointer-events-auto z-10 overflow-hidden"
                        style={{
                            padding: 0,
                            margin: 0,
                            border: 'none',
                            borderRadius: 0,
                            boxShadow: 'none',
                            background: 'transparent',
                        }}
                        variants={columnVariants}
                        transition={transition(0.08)}
                    >
                        <AgentHeroPortrait
                            agent={agentProfile}
                            heroUri={activeImage}
                            avatarUri={avatarUri}
                            imageCount={imageCount}
                            images={images}
                            activeIndex={activeIndex}
                            onPrev={prev}
                            onNext={next}
                            onSelectImage={setActiveIndex}
                            onGalleryChanged={invalidate}
                        />
                    </motion.div>

                    {/* RIGHT COLUMN — Stats Block (padded to match sidebar) */}
                    <motion.div
                        className="w-[300px] flex-shrink-0 pointer-events-auto z-30 p-2"
                        variants={columnVariants}
                        transition={transition(0.16)}
                    >
                        <div className="h-full cc-glass-panel overflow-hidden">
                            <AgentStatBlock
                                agent={agentProfile}
                                level={level}
                            />
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
