// ============================================================
// lib/games/agents/simple-agent.ts
// Simple Tic-Tac-Toe AI agent using minimax algorithm.
// Runs client-side, picks optimal moves from available actions.
// ============================================================

import { TicTacToeState, CellValue } from "../adapters/tic-tac-toe";
import { GameAction } from "../types";

interface TicTacToeAction {
  row: number;
  col: number;
}

// Minimax with alpha-beta pruning
function minimax(
  board: CellValue[][],
  isMaximizing: boolean,
  aiMark: CellValue,
  humanMark: CellValue,
  alpha: number,
  beta: number
): number {
  const winner = checkWinner(board);
  if (winner === aiMark) return 10;
  if (winner === humanMark) return -10;
  if (isBoardFull(board)) return 0;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (board[r][c] === null) {
          board[r][c] = aiMark;
          const score = minimax(board, false, aiMark, humanMark, alpha, beta);
          board[r][c] = null;
          maxEval = Math.max(maxEval, score);
          alpha = Math.max(alpha, score);
          if (beta <= alpha) break;
        }
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (board[r][c] === null) {
          board[r][c] = humanMark;
          const score = minimax(board, true, aiMark, humanMark, alpha, beta);
          board[r][c] = null;
          minEval = Math.min(minEval, score);
          beta = Math.min(beta, score);
          if (beta <= alpha) break;
        }
      }
    }
    return minEval;
  }
}

function checkWinner(board: CellValue[][]): CellValue {
  const lines = [
    [board[0][0], board[0][1], board[0][2]],
    [board[1][0], board[1][1], board[1][2]],
    [board[2][0], board[2][1], board[2][2]],
    [board[0][0], board[1][0], board[2][0]],
    [board[0][1], board[1][1], board[2][1]],
    [board[0][2], board[1][2], board[2][2]],
    [board[0][0], board[1][1], board[2][2]],
    [board[0][2], board[1][1], board[2][0]],
  ];
  for (const line of lines) {
    if (line[0] && line[0] === line[1] && line[1] === line[2]) {
      return line[0];
    }
  }
  return null;
}

function isBoardFull(board: CellValue[][]): boolean {
  return board.every((row) => row.every((cell) => cell !== null));
}

/**
 * Get the best move for the AI agent using minimax.
 * Returns a GameAction with type "place_mark".
 */
export function getAiMove(
  state: TicTacToeState,
  aiPlayerId: string
): GameAction<TicTacToeAction> {
  const aiMark: CellValue = aiPlayerId === "player-x" ? "X" : "O";
  const humanMark: CellValue = aiMark === "X" ? "O" : "X";

  // Deep clone the board for minimax
  const boardCopy = state.board.map((r) => [...r]);

  let bestScore = -Infinity;
  let bestMove: TicTacToeAction = { row: 0, col: 0 };

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (boardCopy[r][c] === null) {
        boardCopy[r][c] = aiMark;
        const score = minimax(boardCopy, false, aiMark, humanMark, -Infinity, Infinity);
        boardCopy[r][c] = null;

        if (score > bestScore) {
          bestScore = score;
          bestMove = { row: r, col: c };
        }
      }
    }
  }

  return {
    type: "place_mark",
    payload: bestMove,
  };
}

/**
 * Get a random valid move (for an easier opponent).
 */
export function getRandomMove(
  state: TicTacToeState
): GameAction<TicTacToeAction> | null {
  const emptyCells: TicTacToeAction[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (state.board[r][c] === null) {
        emptyCells.push({ row: r, col: c });
      }
    }
  }

  if (emptyCells.length === 0) return null;

  const chosen = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  return {
    type: "place_mark",
    payload: chosen,
  };
}
