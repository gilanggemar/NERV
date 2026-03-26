"use client";

// ============================================================
// components/games/TicTacToeBoard.tsx
// SVG-based 3x3 grid renderer with animations.
// ============================================================

import { motion, AnimatePresence } from "framer-motion";
import { TicTacToeState, CellValue } from "@/lib/games/adapters/tic-tac-toe";

interface TicTacToeBoardProps {
  state: TicTacToeState;
  activePlayerId: string | null;
  phase: string;
  lastMoveCell: { row: number; col: number } | null;
  winningLine: number[][] | null;
  humanInputEnabled: boolean;
  onHumanMove?: (row: number, col: number) => void;
}

function XMark({ color = "#f97316" }: { color?: string }) {
  return (
    <motion.svg
      viewBox="0 0 50 50"
      className="w-full h-full p-2.5"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <motion.line
        x1="10" y1="10" x2="40" y2="40"
        stroke={color} strokeWidth="4" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.3 }}
      />
      <motion.line
        x1="40" y1="10" x2="10" y2="40"
        stroke={color} strokeWidth="4" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      />
    </motion.svg>
  );
}

function OMark({ color = "#22d3ee" }: { color?: string }) {
  return (
    <motion.svg
      viewBox="0 0 50 50"
      className="w-full h-full p-2.5"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <motion.circle
        cx="25" cy="25" r="14"
        stroke={color} strokeWidth="4" fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.4 }}
      />
    </motion.svg>
  );
}

export function TicTacToeBoard({
  state,
  activePlayerId,
  phase,
  lastMoveCell,
  winningLine,
  humanInputEnabled,
  onHumanMove,
}: TicTacToeBoardProps) {
  const isGameOver = phase === "completed";
  const winCells = new Set(
    winningLine ? winningLine.map(([r, c]) => `${r}-${c}`) : []
  );

  return (
    <div className="relative w-full max-w-[340px] aspect-square mx-auto">
      <div className="grid grid-cols-3 grid-rows-3 w-full h-full gap-0">
        {state.board.map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            const isLastMove =
              lastMoveCell?.row === rowIdx && lastMoveCell?.col === colIdx;
            const isWinCell = winCells.has(`${rowIdx}-${colIdx}`);
            const isEmpty = cell === null;
            const canClick = humanInputEnabled && isEmpty && !isGameOver;

            return (
              <motion.button
                key={`${rowIdx}-${colIdx}`}
                data-testid="cell"
                data-cell-row={rowIdx}
                data-cell-col={colIdx}
                data-cell-value={cell ?? "empty"}
                disabled={!canClick}
                onClick={() => canClick && onHumanMove?.(rowIdx, colIdx)}
                className={`
                  relative aspect-square flex items-center justify-center
                  transition-all duration-200
                  ${rowIdx < 2 ? "border-b-2" : ""} 
                  ${colIdx < 2 ? "border-r-2" : ""}
                  border-[#333]
                  ${canClick ? "cursor-pointer hover:bg-white/5" : "cursor-default"}
                  ${isLastMove && !isGameOver ? "bg-white/[0.03]" : ""}
                  ${isWinCell ? "bg-[#f97316]/10" : ""}
                `}
                whileHover={canClick ? { scale: 1.05 } : {}}
                whileTap={canClick ? { scale: 0.95 } : {}}
              >
                <AnimatePresence mode="wait">
                  {cell === "X" && <XMark key="x" />}
                  {cell === "O" && <OMark key="o" />}
                </AnimatePresence>

                {/* Hover hint for empty cells */}
                {canClick && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-20 transition-opacity">
                    <div className="w-3 h-3 rounded-full bg-[#f97316]" />
                  </div>
                )}

                {/* Last move pulse indicator */}
                {isLastMove && !isGameOver && (
                  <motion.div
                    className="absolute inset-0 border-2 border-[#f97316]/30 pointer-events-none"
                    initial={{ opacity: 0.8 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 1.5, repeat: 0 }}
                  />
                )}
              </motion.button>
            );
          })
        )}
      </div>

      {/* Winning line overlay */}
      <AnimatePresence>
        {winningLine && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <WinLineOverlay winningLine={winningLine} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WinLineOverlay({ winningLine }: { winningLine: number[][] }) {
  // Calculate line coordinates based on cell positions
  const getCellCenter = (row: number, col: number) => ({
    x: (col * 100) / 3 + 100 / 6,
    y: (row * 100) / 3 + 100 / 6,
  });

  const start = getCellCenter(winningLine[0][0], winningLine[0][1]);
  const end = getCellCenter(winningLine[2][0], winningLine[2][1]);

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <motion.line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke="#f97316"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        style={{ filter: "drop-shadow(0 0 8px #f97316)" }}
      />
    </svg>
  );
}
