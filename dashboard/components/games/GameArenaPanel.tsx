"use client";

// ============================================================
// components/games/GameArenaPanel.tsx
// Top-level game arena component. Contains board, status bar,
// action timeline, controls, and game result overlay.
// ============================================================

import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Skull, Handshake, RotateCcw, Swords, ArrowLeft, Scroll, Wifi, WifiOff } from "lucide-react";
import { useGameStore } from "@/stores/useGameStore";
import { TicTacToeBoard } from "./TicTacToeBoard";
import { AgentStatusBar } from "./AgentStatusBar";
import { ActionTimeline } from "./ActionTimeline";
import { GameControls } from "./GameControls";
import { AgentCommentary } from "./AgentCommentary";
import { TicTacToeState } from "@/lib/games/adapters/tic-tac-toe";
import { GameState } from "@/lib/games/types";

export function GameArenaPanel() {
  const {
    currentSession,
    selectedAgentId,
    selectedAgentName,
    humanPlayerId,
    lastMoveCell,
    winningLine,
    isAgentThinking,
    agentCommentary,
    showCommentary,
    lastMoveSource,
    startGame,
    submitHumanMove,
    resetGame,
    newGameWithSameAgent,
    backToLobby,
    dismissCommentary,
  } = useGameStore();

  const handleDismissCommentary = useCallback(() => dismissCommentary(), [dismissCommentary]);

  if (!currentSession) return null;

  const session = currentSession as GameState<TicTacToeState>;
  const tttState = session.state as TicTacToeState;
  const isHumanTurn = session.activePlayerId === humanPlayerId;
  const isGameOver = session.phase === "completed";
  const agentName = selectedAgentName ?? "Agent";

  // Determine result display
  const result = session.result;
  const humanWon = result?.winnerId === humanPlayerId;
  const isDraw = result?.outcome === "draw";

  return (
    <div className="flex flex-col h-full">
      {/* Top bar: controls + game info */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-[#f97316]" />
            <span className="font-black text-lg uppercase tracking-tight text-white">
              Tic-Tac-Toe
            </span>
          </div>
          <span className="font-mono text-xs text-[#444] uppercase tracking-widest border border-[#222] px-2 py-0.5 bg-black/50">
            {session.phase === "waiting" && "Setup"}
            {session.phase === "active" && `v${session.version}`}
            {session.phase === "completed" && "Finished"}
          </span>
        </div>
        <GameControls
          phase={session.phase}
          onStart={startGame}
          onReset={resetGame}
          onNewGame={newGameWithSameAgent}
          onBack={backToLobby}
        />
      </div>

      {/* Agent status bar — relative container for the floating commentary bubble */}
      <div className="mb-6 relative">
        <AgentStatusBar
          players={session.players}
          activePlayerId={session.activePlayerId}
          phase={session.phase}
          agentName={agentName}
          isAgentThinking={isAgentThinking}
        />

        {/* Floating commentary bubble — absolutely positioned below the agent side */}
        <AgentCommentary
          agentId={selectedAgentId ?? "ai-bot"}
          agentName={agentName}
          commentary={agentCommentary}
          show={showCommentary}
          onDismiss={handleDismissCommentary}
        />
      </div>


      {/* Main content: Board + Timeline side by side */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
        {/* Game Board */}
        <div className="flex-1 flex items-center justify-center relative">
          <TicTacToeBoard
            state={tttState}
            activePlayerId={session.activePlayerId}
            phase={session.phase}
            lastMoveCell={lastMoveCell}
            winningLine={winningLine}
            humanInputEnabled={
              session.phase === "active" && isHumanTurn && !isAgentThinking
            }
            onHumanMove={(row, col) => {
              submitHumanMove({
                type: "place_mark",
                payload: { row, col },
              });
            }}
          />

          {/* Game Result Overlay */}
          <AnimatePresence>
            {isGameOver && result && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                <motion.div
                  className="flex flex-col items-center gap-4 p-8"
                  initial={{ scale: 0.8, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ delay: 0.8, type: "spring", stiffness: 200, damping: 20 }}
                >
                  {humanWon ? (
                    <>
                      <Trophy className="w-14 h-14 text-[#f97316]" />
                      <h3 className="text-3xl font-black uppercase tracking-tight text-[#f97316]">
                        Victory
                      </h3>
                      <p className="text-sm text-[#aaa] font-medium text-center">
                        You defeated {agentName}!
                      </p>
                    </>
                  ) : isDraw ? (
                    <>
                      <Handshake className="w-14 h-14 text-[#888]" />
                      <h3 className="text-3xl font-black uppercase tracking-tight text-white">
                        Draw
                      </h3>
                      <p className="text-sm text-[#aaa] font-medium text-center">
                        Stalemate — board is full
                      </p>
                    </>
                  ) : (
                    <>
                      <Skull className="w-14 h-14 text-[#ef4444]" />
                      <h3 className="text-3xl font-black uppercase tracking-tight text-[#ef4444]">
                        Defeat
                      </h3>
                      <p className="text-sm text-[#aaa] font-medium text-center">
                        {agentName} wins this round
                      </p>
                    </>
                  )}

                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={newGameWithSameAgent}
                      className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-black uppercase tracking-widest
                        bg-[#f97316] text-black hover:bg-[#ff8a3d] transition-all shadow-lg"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      Rematch
                    </button>
                    <button
                      onClick={backToLobby}
                      className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-widest
                        bg-transparent border border-[#333] text-[#888] hover:text-white hover:border-[#555]
                        transition-all"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Lobby
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Timeline */}
        <div className="md:w-[260px] lg:w-[300px] flex flex-col border border-[#222] bg-[#0a0a0a] max-h-[340px] md:max-h-none">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1a1a1a]">
            <Scroll className="w-3.5 h-3.5 text-[#555]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#555]">
              Move Log
            </span>
            <span className="text-xs font-mono text-[#333] ml-auto">
              {session.actionHistory.length}
            </span>
          </div>
          <div className="flex-1 p-2 overflow-hidden flex flex-col">
            <ActionTimeline
              history={session.actionHistory}
              agentName={agentName}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
