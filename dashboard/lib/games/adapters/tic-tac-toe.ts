// ============================================================
// lib/games/adapters/tic-tac-toe.ts
// Complete GameAdapter implementation for Tic-Tac-Toe.
// ============================================================

import { GameAdapter } from "../game-adapter";
import {
  GameAction, ActionDescriptor, GameResult, PlayerId, PlayerSlot
} from "../types";

// --- Game-Specific Types ---

export type CellValue = "X" | "O" | null;

export interface TicTacToeState {
  board: CellValue[][];
  moveCount: number;
}

export interface TicTacToeAction {
  row: number;
  col: number;
}

// --- Adapter Implementation ---

export class TicTacToeAdapter implements GameAdapter<TicTacToeState, TicTacToeAction> {
  readonly gameType = "tic-tac-toe" as const;
  readonly displayName = "Tic-Tac-Toe";
  readonly description = "Classic 3x3 grid game. Two players take turns placing X and O.";
  readonly minPlayers = 2;
  readonly maxPlayers = 2;

  createInitialState(): TicTacToeState {
    return {
      board: [
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ],
      moveCount: 0,
    };
  }

  createPlayerSlots(): Omit<PlayerSlot, "controller" | "agentId">[] {
    return [
      { playerId: "player-x", label: "X" },
      { playerId: "player-o", label: "O" },
    ];
  }

  getAvailableActions(
    state: TicTacToeState,
    _playerId: PlayerId
  ): ActionDescriptor<TicTacToeAction>[] {
    const emptyCells: TicTacToeAction[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (state.board[row][col] === null) {
          emptyCells.push({ row, col });
        }
      }
    }

    if (emptyCells.length === 0) return [];

    return [
      {
        type: "place_mark",
        description: "Place your mark (X or O) on an empty cell",
        payloadSchema: {
          type: "object",
          properties: {
            row: { type: "number", enum: [0, 1, 2], description: "Row index (0=top, 2=bottom)" },
            col: { type: "number", enum: [0, 1, 2], description: "Column index (0=left, 2=right)" },
          },
          required: ["row", "col"],
        },
        validPayloads: emptyCells,
      },
    ];
  }

  validateAction(
    state: TicTacToeState,
    _playerId: PlayerId,
    action: GameAction<TicTacToeAction>
  ): { valid: true } | { valid: false; reason: string } {
    if (action.type !== "place_mark") {
      return { valid: false, reason: `Unknown action type: ${action.type}` };
    }

    const { row, col } = action.payload;

    if (row < 0 || row > 2 || col < 0 || col > 2) {
      return { valid: false, reason: `Position (${row}, ${col}) is out of bounds` };
    }

    if (state.board[row][col] !== null) {
      return { valid: false, reason: `Cell (${row}, ${col}) is already occupied` };
    }

    return { valid: true };
  }

  applyAction(
    state: TicTacToeState,
    playerId: PlayerId,
    action: GameAction<TicTacToeAction>
  ): { newState: TicTacToeState; nextActivePlayerId: PlayerId | null } {
    const { row, col } = action.payload;
    const mark: CellValue = playerId === "player-x" ? "X" : "O";

    const newBoard = state.board.map((r) => [...r]);
    newBoard[row][col] = mark;

    const newState: TicTacToeState = {
      board: newBoard,
      moveCount: state.moveCount + 1,
    };

    const nextActivePlayerId = playerId === "player-x" ? "player-o" : "player-x";
    const result = this.checkResult(newState);

    return {
      newState,
      nextActivePlayerId: result ? null : nextActivePlayerId,
    };
  }

  checkResult(state: TicTacToeState): GameResult | null {
    const { board } = state;
    const lines = [
      // Rows
      [board[0][0], board[0][1], board[0][2]],
      [board[1][0], board[1][1], board[1][2]],
      [board[2][0], board[2][1], board[2][2]],
      // Columns
      [board[0][0], board[1][0], board[2][0]],
      [board[0][1], board[1][1], board[2][1]],
      [board[0][2], board[1][2], board[2][2]],
      // Diagonals
      [board[0][0], board[1][1], board[2][2]],
      [board[0][2], board[1][1], board[2][0]],
    ];

    for (const line of lines) {
      if (line[0] && line[0] === line[1] && line[1] === line[2]) {
        const winnerId = line[0] === "X" ? "player-x" : "player-o";
        return {
          outcome: "win",
          winnerId,
          reason: `Player ${line[0]} wins with three in a row`,
        };
      }
    }

    if (state.moveCount === 9) {
      return { outcome: "draw", winnerId: null, reason: "Board is full — draw" };
    }

    return null;
  }

  filterStateForPlayer(state: TicTacToeState, _playerId: PlayerId): TicTacToeState {
    return state;
  }

  getRenderingHint(): string {
    return "grid-3x3";
  }
}
