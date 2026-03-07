'use client';

import { Activity, ShieldAlert, Cpu } from 'lucide-react';
import { useGamificationStore } from '@/store/useGamificationStore';
import { motion } from 'framer-motion';

export function CommandHUD({ fleetPowerScore }: { fleetPowerScore: number }) {
    return (
        <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-8 z-50 pointer-events-none">
            {/* Left System Info */}
            <div className="flex items-center gap-6 text-xs text-white/50 uppercase tracking-[0.2em]">
                <div className="flex items-center gap-2">
                    <Activity size={14} className="text-emerald-400" />
                    <span>Systems Nominal</span>
                </div>
                <div className="flex items-center gap-2">
                    <Cpu size={14} className="text-blue-400" />
                    <span>Core Link</span>
                </div>
            </div>

            {/* Center Title (Removed per UX request) */}
            <div className="flex flex-col items-center">
                {/* Empty placeholder to preserve flex between spacing */}
            </div>

            {/* Right Stats */}
            <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest">Fleet Power</span>
                    <motion.span
                        className="text-lg font-bold font-mono text-white/90 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                        key={fleetPowerScore}
                        initial={{ scale: 1.2, color: '#fff' }}
                        animate={{ scale: 1, color: 'rgba(255,255,255,0.9)' }}
                    >
                        {fleetPowerScore.toLocaleString()}
                    </motion.span>
                </div>

                {/* Placeholder for future system alerts badge */}
                <div className="cc-glass-panel p-2 rounded-full hidden">
                    <ShieldAlert size={16} className="text-white/50" />
                </div>
            </div>
        </div>
    );
}
