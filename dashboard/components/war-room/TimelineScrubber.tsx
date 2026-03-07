"use client";

import { motion } from "framer-motion";
import { User, MessageSquare } from "lucide-react";
import type { WarRoomEvent } from '@/lib/war-room/types';

interface TimelineScrubberProps {
    events: WarRoomEvent[];
    currentTime: number;
    onTimeChange: (time: number) => void;
}

export function TimelineScrubber({ events, currentTime, onTimeChange }: TimelineScrubberProps) {
    if (events.length === 0) return null;

    const startTime = events[0].timestamp;
    const endTime = events[events.length - 1].timestamp;
    const duration = Math.max(endTime - startTime, 1000); // at least 1s

    // Ensure current time is within bounds
    const safeTime = Math.max(startTime, Math.min(currentTime, endTime));
    const progressPercent = ((safeTime - startTime) / duration) * 100;

    return (
        <div className="w-full flex items-center gap-4 bg-accent/20 border border-border p-3 rounded-xl">
            <button
                className="w-8 h-8 rounded-full bg-background flex items-center justify-center border border-border shadow-sm shrink-0"
                onClick={() => onTimeChange(startTime)}
            >
                <span className="text-[10px] font-bold">|◁</span>
            </button>

            <div className="flex-1 relative h-6 group">
                {/* Track */}
                <div className="absolute top-1/2 -mt-0.5 left-0 right-0 h-1 bg-border rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-blue-500"
                        style={{ width: `${progressPercent}%` }}
                        layout
                    />
                </div>

                {/* Event Markers */}
                {events.map((e, i) => {
                    const left = ((e.timestamp - startTime) / duration) * 100;
                    const isSystem = e.type === 'system';
                    return (
                        <div
                            key={e.id}
                            className={`absolute top-1/2 -mt-1.5 w-3 h-3 rounded-full border-2 border-background shadow-xs hover:scale-150 transition-transform cursor-pointer
                ${isSystem ? 'bg-amber-400 z-10' : 'bg-blue-400 z-0'}
              `}
                            style={{ left: `calc(${left}% - 6px)` }}
                            onClick={() => onTimeChange(e.timestamp)}
                            title={e.content.slice(0, 50)}
                        />
                    );
                })}

                {/* Scrubber Knob */}
                <input
                    type="range"
                    min={startTime}
                    max={endTime}
                    value={safeTime}
                    onChange={(e) => onTimeChange(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
            </div>

            <div className="text-[10px] font-mono text-muted-foreground shrink-0 tabular-nums">
                {new Date(safeTime).toISOString().substring(11, 19)}
            </div>
        </div>
    );
}
