"use client";

// ============================================================
// components/games/ActionTimeline.tsx
// Scrolling log of all actions taken in the game.
// ============================================================

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ActionRecord } from "@/lib/games/types";

interface ActionTimelineProps {
  history: ActionRecord[];
  agentName: string;
}

export function ActionTimeline({ history, agentName }: ActionTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history.length]);

  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center h-full py-6">
        <span className="font-mono text-xs text-[#444] uppercase tracking-widest">
          Awaiting first move...
        </span>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
      {history.map((record, idx) => {
        const isHuman = record.playerId === "player-x";
        const playerLabel = isHuman ? "You" : agentName;
        const mark = record.playerId === "player-x" ? "X" : "O";
        const markColor = mark === "X" ? "#f97316" : "#22d3ee";
        const payload = record.action.payload as { row: number; col: number };
        const cellName = `R${payload.row + 1}C${payload.col + 1}`;

        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 px-3 py-2 bg-[#0a0a0a] border border-[#1a1a1a] hover:border-[#333] transition-colors text-sm"
          >
            <span className="font-mono text-xs text-[#333] w-6 text-right shrink-0">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <span
              className="font-black font-mono text-sm w-5 shrink-0"
              style={{ color: markColor }}
            >
              {mark}
            </span>
            <span className="text-[#aaa] font-medium truncate">
              {playerLabel}
            </span>
            <span className="text-[#555] font-mono text-xs ml-auto shrink-0">
              → {cellName}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
