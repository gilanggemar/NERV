'use client';

import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';

interface OpsStreakBadgeProps {
    currentStreak: number;
}

export function OpsStreakBadge({ currentStreak }: OpsStreakBadgeProps) {
    if (currentStreak === 0) return null;

    return (
        <motion.div
            className="absolute top-24 left-8 z-40 flex items-center gap-3 cc-glass-panel px-4 py-2 rounded-full border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)]"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
        >
            <div className="relative">
                <Flame size={20} className="text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                <motion.div
                    className="absolute inset-0 bg-orange-500/50 blur-md rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] text-orange-200/70 uppercase tracking-widest leading-none">Ops Streak</span>
                <span className="text-sm font-bold font-mono text-orange-400 drop-shadow-[0_0_5px_rgba(249,115,22,0.5)]">
                    {currentStreak} DAY{currentStreak > 1 ? 'S' : ''}
                </span>
            </div>
        </motion.div>
    );
}
