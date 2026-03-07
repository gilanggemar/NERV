"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useOverviewData } from '@/hooks/useOverviewData';
import { Shield, Check, Circle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { staggerContainer, fadeInUp } from '@/lib/animations';

const DIFFICULTY_COLORS = {
    'EASY': 'var(--mission-easy)',
    'MEDIUM': 'var(--mission-medium)',
    'HARD': 'var(--mission-hard)',
};

export function DailyMissionsBoard() {
    const { missions } = useOverviewData();
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setHours(24, 0, 0, 0);
            const diffMs = tomorrow.getTime() - now.getTime();
            const h = Math.floor(diffMs / (1000 * 60 * 60));
            const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            setTimeLeft(`Resets in ${h}h ${m}m`);
        };
        updateTimer();
        const interval = setInterval(updateTimer, 60000);
        return () => clearInterval(interval);
    }, []);

    const allClear = missions.list.length > 0 && missions.allCompleted;

    return (
        <div className={cn(
            "nerv-glass-1 rounded-xl p-5 border transition-all duration-500 relative overflow-hidden",
            allClear ? "border-[var(--accent-gold)]/50 shadow-[0_0_20px_var(--accent-gold)]" : "border-border/50"
        )}>
            {allClear && (
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-gold)]/5 to-[var(--accent-gold)]/0 pointer-events-none" />
            )}

            <div className="flex items-center justify-between mb-4 relative z-10">
                <h3 className="nerv-section flex items-center gap-2">
                    <Shield size={14} className={allClear ? "text-[var(--accent-gold)]" : "text-muted-foreground"} />
                    <span className={allClear ? "text-[var(--accent-gold)] drop-shadow-md" : ""}>
                        {allClear ? "ALL CLEAR ✦" : "DAILY MISSIONS"}
                    </span>
                </h3>
                <span className="nerv-timer text-muted-foreground/80">{timeLeft}</span>
            </div>

            <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="flex flex-col gap-2 relative z-10"
            >
                {missions.list.map((mission) => {
                    const completed = typeof mission.isCompleted === 'number' ? mission.isCompleted === 1 : mission.isCompleted;
                    return (
                        <motion.div
                            key={mission.id}
                            variants={fadeInUp}
                            className={cn(
                                "group flex items-center gap-3 p-3 rounded-lg border transition-all duration-300",
                                completed ? "bg-white/5 border-white/10" : "bg-black/20 border-white/5 hover:border-white/15"
                            )}
                        >
                            <div className="relative flex items-center justify-center shrink-0">
                                {completed ? (
                                    <motion.div
                                        initial={{ scale: 0, rotate: -90 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        className="w-5 h-5 rounded-full bg-[var(--status-online)] flex items-center justify-center text-black"
                                    >
                                        <Check size={12} strokeWidth={3} />
                                    </motion.div>
                                ) : (
                                    <Circle size={20} className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className={cn("nerv-mission-title truncate", completed && "text-muted-foreground line-through opacity-70")}>
                                    {mission.title}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold" style={{ color: 'var(--accent-gold)' }}>
                                        +{mission.xpReward} XP
                                    </span>
                                    <div className="w-1 h-1 rounded-full bg-white/10" />
                                    <span
                                        className="text-[9px] uppercase tracking-wider font-bold rounded-sm px-1 py-0.5 bg-background border border-border"
                                        style={{ color: DIFFICULTY_COLORS[mission.difficulty] }}
                                    >
                                        {mission.difficulty}
                                    </span>
                                </div>
                            </div>

                            {!completed && mission.target > 1 && (
                                <div className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded bg-background border border-border">
                                    <span className="text-xs font-medium">{mission.current}</span>
                                    <span className="text-xs text-muted-foreground">/ {mission.target}</span>
                                </div>
                            )}
                        </motion.div>
                    );
                })}

                {missions.list.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground flex flex-col items-center">
                        <Sparkles className="mb-2 opacity-50" size={24} />
                        <span className="text-sm">Generating missions...</span>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
