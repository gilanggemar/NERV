"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Network, Activity, Cpu } from "lucide-react";

interface StatProp {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
}

interface DashboardStatsPanelProps {
    stats: StatProp[];
}

export function DashboardStatsPanel({ stats }: DashboardStatsPanelProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="absolute right-8 top-1/2 transform -translate-y-1/2 z-40 flex items-center pointer-events-auto">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="cc-glass-panel p-2 rounded-l-md hover:bg-white/10 transition-colors border-r-0 z-10"
                aria-label={isExpanded ? "Collapse Stats" : "Expand Stats"}
            >
                {isExpanded ? <ChevronRight size={16} className="text-white/50" /> : <ChevronLeft size={16} className="text-white/50" />}
            </button>

            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "auto", opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden cc-glass-panel rounded-r-md border-l-0 bg-black/40 backdrop-blur-md flex flex-col gap-4 p-4 min-w-[160px]"
                    >
                        {stats.map((stat, i) => (
                            <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0 gap-6">
                                <div className="flex items-center gap-2 text-white/50">
                                    {stat.icon && <span className="opacity-70">{stat.icon}</span>}
                                    <span className="text-[10px] uppercase tracking-widest">{stat.label}</span>
                                </div>
                                <span className="text-sm font-bold font-mono text-white/90 drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]">
                                    {stat.value}
                                </span>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
