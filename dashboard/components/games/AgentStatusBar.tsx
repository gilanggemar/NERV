"use client";

// ============================================================
// components/games/AgentStatusBar.tsx
// Horizontal bar showing player slots, controller info, and turn indicator.
// ============================================================

import { motion } from "framer-motion";
import { PlayerSlot, GamePhase } from "@/lib/games/types";
import { Bot, User, Loader2 } from "lucide-react";

interface AgentStatusBarProps {
  players: PlayerSlot[];
  activePlayerId: string | null;
  phase: GamePhase;
  agentName: string;
  isAgentThinking: boolean;
}

export function AgentStatusBar({
  players,
  activePlayerId,
  phase,
  agentName,
  isAgentThinking,
}: AgentStatusBarProps) {
  return (
    <div className="flex items-center gap-3 w-full">
      {players.map((player) => {
        const isActive = phase === "active" && activePlayerId === player.playerId;
        const isHuman = player.controller.type === "human";
        const isThinking = isActive && !isHuman && isAgentThinking;
        const label = player.label;
        const controllerLabel = isHuman ? "You" : agentName;
        const markColor = label === "X" ? "#f97316" : "#22d3ee";

        return (
          <motion.div
            key={player.playerId}
            className={`
              flex items-center gap-3 flex-1 px-4 py-3 border
              transition-all duration-300
              ${isActive
                ? "border-[#f97316] bg-[#f97316]/5 shadow-[0_0_20px_rgba(249,115,22,0.1)]"
                : "border-[#222] bg-[#111]"
              }
            `}
            animate={isActive ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {/* Turn indicator */}
            <div className="relative flex items-center justify-center">
              {isActive && (
                <motion.div
                  className="absolute w-3 h-3 rounded-full bg-[#f97316]"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
              <div
                className={`w-2.5 h-2.5 rounded-full z-10 ${
                  isActive ? "bg-[#f97316]" : "bg-[#333]"
                }`}
              />
            </div>

            {/* Player mark */}
            <span
              className="font-black text-xl font-mono"
              style={{ color: markColor }}
            >
              {label}
            </span>

            {/* Controller info */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {isHuman ? (
                <User className="w-3.5 h-3.5 text-[#888] shrink-0" />
              ) : (
                <Bot className="w-3.5 h-3.5 text-[#888] shrink-0" />
              )}
              <span className="text-sm font-bold text-[#aaa] truncate">
                {controllerLabel}
              </span>
            </div>

            {/* Thinking indicator */}
            {isThinking && (
              <Loader2 className="w-4 h-4 text-[#f97316] animate-spin shrink-0" />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
