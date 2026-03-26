"use client";

// ============================================================
// stores/useGameStore.ts
// Zustand store wrapping the GameSessionManager.
// Manages game lifecycle, human moves, and REAL agent turns
// via the OpenClaw gateway (with minimax fallback).
// ============================================================

import { create } from "zustand";
import { GameState, GameAction, PlayerId, GameType } from "@/lib/games/types";
import { GameSessionManager } from "@/lib/games/game-session-manager";
import { createDefaultRegistry } from "@/lib/games/adapters";
import { TicTacToeState } from "@/lib/games/adapters/tic-tac-toe";
import { requestAgentMove } from "@/lib/games/agent-gateway-bridge";

// Create singleton instances
const registry = createDefaultRegistry();
const sessionManager = new GameSessionManager(registry);

export type GameView = "lobby" | "agent-select" | "playing";

export interface GameStoreState {
  // Navigation
  view: GameView;

  // Current game session
  currentSession: GameState | null;

  // Agent selection
  selectedAgentId: string | null;
  selectedAgentName: string | null;
  humanPlayerId: PlayerId;
  agentPlayerId: PlayerId;

  // UI state
  lastMoveCell: { row: number; col: number } | null;
  winningLine: number[][] | null;
  isAgentThinking: boolean;

  // Agent commentary
  agentCommentary: string | null;
  showCommentary: boolean;
  lastMoveSource: "agent" | "fallback" | null;

  // Actions
  setView: (view: GameView) => void;
  selectAgent: (agentId: string, agentName: string) => void;
  createGame: (gameType: GameType) => void;
  startGame: () => void;
  submitHumanMove: (action: GameAction) => void;
  resetGame: () => void;
  backToLobby: () => void;
  newGameWithSameAgent: () => void;
  dismissCommentary: () => void;
}

function findWinningLine(board: (string | null)[][]): number[][] | null {
  const lines = [
    [[0,0],[0,1],[0,2]],
    [[1,0],[1,1],[1,2]],
    [[2,0],[2,1],[2,2]],
    [[0,0],[1,0],[2,0]],
    [[0,1],[1,1],[2,1]],
    [[0,2],[1,2],[2,2]],
    [[0,0],[1,1],[2,2]],
    [[0,2],[1,1],[2,0]],
  ];

  for (const line of lines) {
    const [a, b, c] = line;
    const va = board[a[0]][a[1]];
    const vb = board[b[0]][b[1]];
    const vc = board[c[0]][c[1]];
    if (va && va === vb && vb === vc) {
      return line;
    }
  }
  return null;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  view: "lobby",
  currentSession: null,
  selectedAgentId: null,
  selectedAgentName: null,
  humanPlayerId: "player-x",
  agentPlayerId: "player-o",
  lastMoveCell: null,
  winningLine: null,
  isAgentThinking: false,
  agentCommentary: null,
  showCommentary: false,
  lastMoveSource: null,

  setView: (view) => set({ view }),

  selectAgent: (agentId, agentName) => set({
    selectedAgentId: agentId,
    selectedAgentName: agentName,
  }),

  createGame: (gameType) => {
    const state = get();
    const session = sessionManager.createSession(gameType);

    // Assign human to X, agent to O
    sessionManager.assignPlayer(session.sessionId, "player-x", "human");
    const updated = sessionManager.assignPlayer(
      session.sessionId,
      "player-o",
      "agent",
      state.selectedAgentId ?? "ai-bot"
    );

    set({
      currentSession: updated,
      view: "playing",
      lastMoveCell: null,
      winningLine: null,
      agentCommentary: null,
      showCommentary: false,
    });
  },

  startGame: () => {
    const state = get();
    if (!state.currentSession) return;

    try {
      const started = sessionManager.startSession(state.currentSession.sessionId);
      set({ currentSession: started });
    } catch (err) {
      console.error("[GameStore] Failed to start game:", err);
    }
  },

  submitHumanMove: (action) => {
    const state = get();
    if (!state.currentSession) return;
    if (state.currentSession.phase !== "active") return;
    if (state.currentSession.activePlayerId !== state.humanPlayerId) return;
    if (state.isAgentThinking) return;

    const result = sessionManager.processAction(
      state.currentSession.sessionId,
      state.humanPlayerId,
      action
    );

    if (!result.success) {
      console.warn("[GameStore] Invalid move:", result.error);
      return;
    }

    const newSession = result.newState as GameState<TicTacToeState>;
    const payload = action.payload as { row: number; col: number };

    // Check for winning line
    const wl = newSession.phase === "completed"
      ? findWinningLine((newSession.state as TicTacToeState).board)
      : null;

    set({
      currentSession: newSession,
      lastMoveCell: { row: payload.row, col: payload.col },
      winningLine: wl,
      showCommentary: false,
      agentCommentary: null,
    });

    // If game is still active and it's the agent's turn, request move from REAL agent
    if (newSession.phase === "active" && newSession.activePlayerId === state.agentPlayerId) {
      set({ isAgentThinking: true });

      const agentId = state.selectedAgentId ?? "ai-bot";
      const agentName = state.selectedAgentName ?? "Agent";

      // Request move from the real OpenClaw agent (with minimax fallback)
      requestAgentMove(
        newSession.state as TicTacToeState,
        state.agentPlayerId,
        agentId,
        agentName,
        newSession.gameType
      ).then((moveResult) => {
        const current = get();
        if (!current.currentSession || current.currentSession.phase !== "active") {
          set({ isAgentThinking: false });
          return;
        }

        const aiResult = sessionManager.processAction(
          current.currentSession.sessionId,
          current.agentPlayerId,
          moveResult.action
        );

        if (aiResult.success && aiResult.newState) {
          const aiPayload = moveResult.action.payload as { row: number; col: number };
          const aiSession = aiResult.newState as GameState<TicTacToeState>;
          const aiWl = aiSession.phase === "completed"
            ? findWinningLine((aiSession.state as TicTacToeState).board)
            : null;

          set({
            currentSession: aiSession,
            lastMoveCell: { row: aiPayload.row, col: aiPayload.col },
            winningLine: aiWl,
            isAgentThinking: false,
            lastMoveSource: moveResult.source,
            agentCommentary: moveResult.commentary,
            showCommentary: !!moveResult.commentary,
          });
        } else {
          set({ isAgentThinking: false });
        }
      }).catch((err) => {
        console.error("[GameStore] Agent move failed:", err);
        set({ isAgentThinking: false });
      });
    }
  },

  dismissCommentary: () => set({ showCommentary: false }),

  resetGame: () => {
    const state = get();
    if (!state.currentSession) return;

    const reset = sessionManager.resetSession(state.currentSession.sessionId);
    // Re-assign players
    sessionManager.assignPlayer(reset.sessionId, "player-x", "human");
    const updated = sessionManager.assignPlayer(
      reset.sessionId,
      "player-o",
      "agent",
      state.selectedAgentId ?? "ai-bot"
    );

    set({
      currentSession: updated,
      lastMoveCell: null,
      winningLine: null,
      isAgentThinking: false,
      agentCommentary: null,
      showCommentary: false,
    });
  },

  newGameWithSameAgent: () => {
    const state = get();
    if (state.currentSession) {
      sessionManager.deleteSession(state.currentSession.sessionId);
    }
    // Create a fresh session
    state.createGame(state.currentSession?.gameType ?? "tic-tac-toe");
    // Start immediately
    setTimeout(() => get().startGame(), 50);
  },

  backToLobby: () => {
    const state = get();
    if (state.currentSession) {
      sessionManager.deleteSession(state.currentSession.sessionId);
    }
    set({
      view: "lobby",
      currentSession: null,
      selectedAgentId: null,
      selectedAgentName: null,
      lastMoveCell: null,
      winningLine: null,
      isAgentThinking: false,
      agentCommentary: null,
      showCommentary: false,
    });
  },
}));
