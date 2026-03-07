'use client';

import dynamic from 'next/dynamic';
import { useCommandCenter } from '@/hooks/useCommandCenter';
import { AgentShowcase } from '@/components/command-center/AgentShowcase';
import { AgentCarousel } from '@/components/command-center/AgentCarousel';

const NebulaBg = dynamic(
    () => import('@/components/command-center/NebulaBg').then(mod => mod.NebulaBg),
    { ssr: false }
);

const AtmosphereLayer = dynamic(
    () => import('@/components/command-center/AtmosphereLayer').then(mod => mod.AtmosphereLayer),
    { ssr: false }
);

export default function OverviewPage() {
    const {
        isMounted,
        activeAgent,
        activeAgentXp,
        fleetPowerScore,
        currentStreak,
        setActiveAgentId
    } = useCommandCenter();

    if (!isMounted) {
        return <div className="w-screen h-screen bg-black" />;
    }

    return (
        <div className="relative -ml-3 -mr-8 -mt-6 -mb-6 w-[calc(100%+2.75rem)] overflow-hidden text-white selection:bg-white/20"
            style={{ height: 'calc(100% + 3rem)' }}
        >
            {/* Layer 0: Interactive Particle Background */}
            <NebulaBg colorHex={activeAgent.colorHex} />

            {/* Layer 1: Ambient Atmosphere Glow */}
            <AtmosphereLayer colorHex={activeAgent.colorHex} />

            {/* Layer 2: Main Content — full height, carousel overlays */}
            <div className="absolute inset-0 z-10 pointer-events-none">

                {/* Three-Column Agent Showcase — fills 100% height */}
                <AgentShowcase
                    agentProfile={activeAgent}
                    level={activeAgentXp.level}
                    currentXp={activeAgentXp.totalXp}
                    xpToNext={activeAgentXp.xpToNextLevel}
                    rank={activeAgentXp.rank}
                    currentStreak={currentStreak}
                />

                {/* Carousel Dock — overlays bottom of hero image */}
                <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none flex justify-center px-2 pb-2">
                    <div className="pointer-events-auto">
                        <AgentCarousel
                            activeAgentId={activeAgent.id}
                            onSelectAgent={setActiveAgentId}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}
