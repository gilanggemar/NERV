'use client';

import { Activity, Play, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAuditStore } from '@/store/useAuditStore';

export function ActivityStream() {
    const { entries, fetchLogs } = useAuditStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        fetchLogs();
        setMounted(true);
        const interval = setInterval(() => fetchLogs(), 10000);
        return () => clearInterval(interval);
    }, [fetchLogs]);

    if (!mounted || entries.length === 0) return null;

    return (
        <motion.div
            className="absolute right-8 top-1/2 transform -translate-y-1/2 z-40 w-80 cc-glass-panel flex flex-col pointer-events-auto overflow-hidden border-r-4 border-r-purple-500/50 max-h-[60vh]"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
        >
            <div className="bg-black/40 px-4 py-3 border-b border-white/10 flex items-center justify-between sticky top-0 z-10">
                <h3 className="text-sm font-bold tracking-widest uppercase text-white/90 flex items-center gap-2 font-mono">
                    <Activity size={16} className="text-purple-400" />
                    Live Stream
                </h3>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </div>

            <div className="p-4 flex flex-col gap-3 overflow-y-auto no-scrollbar">
                <AnimatePresence>
                    {entries.slice(0, 10).map((log, i) => {
                        let Icon = Play;
                        let colorClass = "text-blue-400";
                        if (log.action.includes('error') || log.action.includes('fail')) {
                            Icon = AlertCircle;
                            colorClass = "text-red-400";
                        } else if (log.action.includes('success') || log.action.includes('complete')) {
                            Icon = Check;
                            colorClass = "text-green-400";
                        }

                        return (
                            <motion.div
                                key={log.id}
                                className="flex gap-3 text-sm items-start"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <div className={`mt-0.5 shrink-0 ${colorClass}`}>
                                    <Icon size={14} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-white/80 uppercase text-[10px] font-mono tracking-widest shrink-0">
                                            {log.agentId}
                                        </span>
                                        <span className="text-white/50 text-[10px] truncate">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <span className="text-white/70 text-xs leading-snug break-words">
                                        {log.action}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
