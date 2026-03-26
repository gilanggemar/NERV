"use client";

// ============================================================
// components/games/GameControls.tsx
// Start, reset, new game, and back-to-lobby controls.
// ============================================================

import { RotateCcw, Play, ArrowLeft, Swords } from "lucide-react";
import { GamePhase } from "@/lib/games/types";

interface GameControlsProps {
  phase: GamePhase;
  onStart: () => void;
  onReset: () => void;
  onNewGame: () => void;
  onBack: () => void;
}

export function GameControls({
  phase,
  onStart,
  onReset,
  onNewGame,
  onBack,
}: GameControlsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-widest
          bg-transparent border border-[#333] text-[#888] hover:text-white hover:border-[#555]
          transition-all"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Lobby
      </button>

      {phase === "waiting" && (
        <button
          onClick={onStart}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-widest
            bg-[#f97316] text-black hover:bg-[#ff8a3d] transition-all shadow-lg"
        >
          <Play className="w-3.5 h-3.5" />
          Start Match
        </button>
      )}

      {(phase === "active" || phase === "completed") && (
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-widest
            bg-transparent border border-[#333] text-[#888] hover:text-white hover:border-[#555]
            transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      )}

      {phase === "completed" && (
        <button
          onClick={onNewGame}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-widest
            bg-[#f97316] text-black hover:bg-[#ff8a3d] transition-all shadow-lg"
        >
          <Swords className="w-3.5 h-3.5" />
          Rematch
        </button>
      )}
    </div>
  );
}
