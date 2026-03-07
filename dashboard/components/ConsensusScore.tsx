import React, { memo, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ConsensusScoreProps {
    score: number;
    agentCount: number;
    round: number;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const SIZE_MAP = {
    sm: {
        container: 64,
        textSize: 18,
        labelSize: 8,
    },
    md: {
        container: 96,
        textSize: 24,
        labelSize: 10,
    },
    lg: {
        container: 128,
        textSize: 32,
        labelSize: 12,
    },
};

export const ConsensusScore = memo(({
    score,
    agentCount,
    round,
    size = 'md',
    className
}: ConsensusScoreProps) => {
    const controls = useAnimation();
    const clampedScore = Math.max(0, Math.min(100, score));
    const isComplete = clampedScore === 100;
    const isPlaceholder = agentCount === 0 || round === 0;

    useEffect(() => {
        if (isComplete) {
            controls.start({
                scale: [1, 1.1, 1],
                transition: { duration: 0.5, ease: "easeInOut" }
            });
        }
    }, [isComplete, controls]);

    const metrics = SIZE_MAP[size];
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = isPlaceholder ? circumference : circumference * (1 - clampedScore / 100);

    // Calculate dynamic color
    const hue = 25 + (clampedScore / 100) * 110;
    const lightness = 0.65 + (clampedScore / 100) * 0.13;
    const color = isPlaceholder ? 'var(--status-offline)' : `oklch(${lightness} 0.17 ${hue})`;

    return (
        <motion.div
            className={cn("relative flex items-center justify-center font-sans", className)}
            style={{ width: metrics.container, height: metrics.container }}
            animate={controls}
        >
            <svg
                viewBox="0 0 100 100"
                className="w-full h-full"
                style={{ overflow: 'visible' }}
            >
                <defs>
                    <filter id="consensus-glow">
                        <feGaussianBlur stdDeviation="2" />
                    </filter>
                </defs>

                {/* Background Track */}
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="var(--foreground)"
                    strokeOpacity={0.08}
                    strokeWidth="6"
                />

                {/* Progress Arc */}
                <g transform="rotate(-90 50 50)">
                    <motion.circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke={color}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                        filter={clampedScore > 80 && !isPlaceholder ? "url(#consensus-glow)" : "none"}
                    />
                </g>

                {/* Center Text */}
                {!isPlaceholder && (
                    <>
                        {/* Round Label (Top) */}
                        <text
                            x="50"
                            y={size === 'sm' ? 28 : (size === 'md' ? 30 : 26)}
                            textAnchor="middle"
                            className="fill-foreground opacity-50 font-medium"
                            fontSize={metrics.labelSize}
                        >
                            Round {round}
                        </text>

                        {/* Score/Checkmark (Center) */}
                        {isComplete ? (
                            <g transform="translate(38, 38) scale(1.0)">
                                <motion.path
                                    d="M4 12L9 17L20 6"
                                    fill="transparent"
                                    stroke={color}
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.4, delay: 0.2 }}
                                />
                            </g>
                        ) : (
                            <text
                                x="50"
                                y="52"
                                textAnchor="middle"
                                dominantBaseline="central"
                                className="font-bold tabular-nums"
                                fill={color}
                                fontSize={metrics.textSize}
                            >
                                {clampedScore}%
                            </text>
                        )}

                        {/* Agents Label (Bottom) */}
                        <text
                            x="50"
                            y={size === 'sm' ? 76 : (size === 'md' ? 74 : 76)}
                            textAnchor="middle"
                            className="fill-foreground opacity-50 font-medium"
                            fontSize={metrics.labelSize}
                        >
                            {agentCount} agents
                        </text>
                    </>
                )}

                {/* Placeholder Text */}
                {isPlaceholder && (
                    <text
                        x="50"
                        y="52"
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="fill-foreground opacity-30 font-bold"
                        fontSize={metrics.textSize * 0.8}
                    >
                        N/A
                    </text>
                )}
            </svg>
        </motion.div>
    );
});

ConsensusScore.displayName = 'ConsensusScore';
export default ConsensusScore;
