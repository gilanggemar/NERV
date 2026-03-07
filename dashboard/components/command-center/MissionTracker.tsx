'use client';

import { Target, CheckCircle2 } from 'lucide-react';
import { useGamificationStore } from '@/store/useGamificationStore';
import { motion } from 'framer-motion';

export function MissionTracker() {
    const { dailyMissions, allMissionsCompleted } = useGamificationStore();

    if (!dailyMissions || dailyMissions.length === 0) return null;

    return (
        <motion.div
            className="absolute left-8 top-1/2 transform -translate-y-1/2 z-40 w-72 cc-glass-panel flex flex-col pointer-events-auto overflow-hidden border-l-4 border-l-blue-500/50"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            <div className="bg-black/40 px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-sm font-bold tracking-widest uppercase text-white/90 flex items-center gap-2 font-mono">
                    <Target size={16} className="text-blue-400" />
                    Daily Directives
                </h3>
                <span className="text-[10px] text-blue-400/80 font-mono tracking-wider">
                    {dailyMissions.filter(m => m.isCompleted).length}/{dailyMissions.length}
                </span>
            </div>

            <div className="p-4 flex flex-col gap-4">
                {dailyMissions.map((mission) => {
                    const isDone = Boolean(mission.isCompleted);
                    const percent = Math.min(100, (mission.current / mission.target) * 100);

                    return (
                        <div key={mission.id} className={`flex flex-col gap-2 ${isDone ? 'opacity-50' : ''}`}>
                            <div className="flex justify-between items-start gap-2">
                                <span className={`text-xs font-medium leading-tight ${isDone ? 'line-through text-white/40' : 'text-white/80'}`}>
                                    {mission.title}
                                </span>
                                {isDone && <CheckCircle2 size={14} className="text-green-400 shrink-0" />}
                            </div>

                            {!isDone && (
                                <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percent}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                    />
                                </div>
                            )}

                            <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                <span>{mission.difficulty} • +{mission.xpReward} XP</span>
                                {!isDone && <span>{mission.current} / {mission.target}</span>}
                            </div>
                        </div>
                    );
                })}

                {allMissionsCompleted && (
                    <motion.div
                        className="mt-2 text-center text-xs font-mono text-green-400 p-2 bg-green-950/30 border border-green-500/30 rounded"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                    >
                        ALL DIRECTIVES CLEARED (+75 XP BONUS)
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
