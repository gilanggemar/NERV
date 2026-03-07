'use client';

import { motion } from "framer-motion";

interface XPProgressRingProps {
    level: number;
    currentXp: number;
    xpToNext: number;
    rank: string;
    size?: number;
    strokeWidth?: number;
    colorHex?: string;
}

export function XPProgressRing({
    level,
    currentXp,
    xpToNext,
    rank,
    size = 120,
    strokeWidth = 6,
    colorHex = "#3b82f6"
}: XPProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const safeCurrent = Math.min(Math.max(currentXp, 0), xpToNext);
    const percent = xpToNext > 0 ? safeCurrent / xpToNext : 0;
    const strokeDashoffset = circumference - percent * circumference;

    return (
        <div className="relative flex items-center justify-center transform hover:scale-105 transition-transform duration-300" style={{ width: size, height: size }}>
            {/* Background Circle */}
            <svg className="absolute inset-0 transform -rotate-90" width={size} height={size}>
                <circle
                    className="text-white/10"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                {/* Progress Circle */}
                <motion.circle
                    stroke={colorHex}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    style={{ strokeDasharray: circumference }}
                    className="drop-shadow-[0_0_5px_currentColor]"
                />
            </svg>
            {/* Center Content */}
            <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-white/50 uppercase tracking-widest">{rank}</span>
                <span className="text-xl font-bold font-mono text-white/90 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                    LVL {level}
                </span>
                <span className="text-[8px] text-white/40 tracking-wider">
                    {Math.floor(safeCurrent)} / {xpToNext} XP
                </span>
            </div>
        </div>
    );
}
