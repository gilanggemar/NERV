'use client';

import { motion } from 'framer-motion';

interface StatNode {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
}

interface OrbitalStatsRingProps {
    stats: StatNode[];
    radius?: number;
}

export function OrbitalStatsRing({ stats, radius = 220 }: OrbitalStatsRingProps) {
    if (!stats || stats.length === 0) return null;

    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            {/* Subtle orbital ring line */}
            <div
                className="absolute border border-white/5 rounded-full"
                style={{ width: radius * 2, height: radius * 2 }}
            />

            {/* Rotating stats container */}
            <motion.div
                className="absolute inset-0"
            >
                {stats.map((stat, i) => {
                    const angle = (i / stats.length) * 360;
                    // Calculate position purely using CSS transforms for rotation
                    return (
                        <motion.div
                            key={i}
                            className="absolute left-1/2 top-1/2 pointer-events-auto cursor-help"
                            style={{
                                x: '-50%',
                                y: '-50%',
                                rotate: angle,
                                transformOrigin: `0 ${radius}px`,
                                marginTop: -radius
                            }}
                        >
                            {/* Counter-rotate the actual content so it stays upright */}
                            <motion.div
                                className="cc-glass-panel px-3 py-1.5 rounded-full flex items-center gap-2 group hover:bg-white/10 hover:border-white/20 transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                                style={{ rotate: -angle }}
                                whileHover={{ scale: 1.1 }}
                            >
                                {stat.icon && <span className="text-white/50 group-hover:text-white/80">{stat.icon}</span>}
                                <div className="flex flex-col items-center leading-none">
                                    <span className="text-[9px] text-white/40 uppercase tracking-widest">{stat.label}</span>
                                    <span className="text-sm font-bold font-mono text-white/90 drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]">
                                        {stat.value}
                                    </span>
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })}
            </motion.div>
        </div>
    );
}
