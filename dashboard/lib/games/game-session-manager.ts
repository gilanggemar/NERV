// ============================================================
// lib/games/game-session-manager.ts
// Owns canonical game state for all active sessions.
// ============================================================

import {
  GameState, GameSessionId, GameType, GameAction, PlayerId,
  ActionResponse, ActionRecord, AgentId
} from "./types";
import { AdapterRegistry } from "./adapter-registry";

let sessionCounter = 0;
function generateId(): string {
  sessionCounter++;
  return `game-${Date.now()}-${sessionCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

export class GameSessionManager {
  private sessions = new Map<GameSessionId, GameState>();

  constructor(private adapterRegistry: AdapterRegistry) {}

  createSession(gameType: GameType, config?: Record<string, unknown>): GameState {
    const adapter = this.adapterRegistry.get(gameType);
    const sessionId = generateId();
    const initialState = adapter.createInitialState(config);
    const playerSlots = adapter.createPlayerSlots(config).map((slot) => ({
      ...slot,
      controller: { type: "vacant" as const },
      agentId: null,
    }));

    const gameState: GameState = {
      sessionId,
      gameType,
      phase: "waiting",
      version: 0,
      updatedAt: new Date().toISOString(),
      state: initialState,
      players: playerSlots,
      activePlayerId: null,
      result: null,
      actionHistory: [],
    };

    this.sessions.set(sessionId, gameState);
    return gameState;
  }

  getSession(sessionId: GameSessionId): GameState | null {
    return this.sessions.get(sessionId) ?? null;
  }

  assignPlayer(
    sessionId: GameSessionId,
    playerId: PlayerId,
    controllerType: "human" | "agent",
    agentId?: AgentId
  ): GameState {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const updatedPlayers = session.players.map((p) => {
      if (p.playerId === playerId) {
        return {
          ...p,
          controller: {
            type: controllerType,
            ...(agentId ? { agentId } : {}),
          },
          agentId: agentId ?? null,
        };
      }
      return p;
    });

    const updatedSession: GameState = {
      ...session,
      players: updatedPlayers,
      version: session.version + 1,
      updatedAt: new Date().toISOString(),
    };

    this.sessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  startSession(sessionId: GameSessionId): GameState {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);
    if (session.phase !== "waiting") {
      throw new Error(`Cannot start game in phase: ${session.phase}`);
    }

    const vacant = session.players.filter((p) => p.controller.type === "vacant");
    if (vacant.length > 0) {
      throw new Error(`Cannot start: ${vacant.length} player slot(s) still vacant`);
    }

    const updatedSession: GameState = {
      ...session,
      phase: "active",
      activePlayerId: session.players[0].playerId,
      version: session.version + 1,
      updatedAt: new Date().toISOString(),
    };

    this.sessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  processAction(
    sessionId: GameSessionId,
    playerId: PlayerId,
    action: GameAction
  ): ActionResponse {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, error: { code: "GAME_NOT_ACTIVE", message: "Session not found" } };
    }
    if (session.phase !== "active") {
      return { success: false, error: { code: "GAME_NOT_ACTIVE", message: `Game is ${session.phase}` } };
    }
    if (session.activePlayerId !== playerId) {
      return { success: false, error: { code: "NOT_YOUR_TURN", message: `It's not ${playerId}'s turn` } };
    }

    const adapter = this.adapterRegistry.get(session.gameType);

    // Validate
    const validation = adapter.validateAction(session.state, playerId, action);
    if (!validation.valid) {
      return {
        success: false,
        error: { code: "ILLEGAL_MOVE", message: validation.reason },
      };
    }

    // Apply
    const { newState, nextActivePlayerId } = adapter.applyAction(
      session.state, playerId, action
    );

    // Record action
    const actionRecord: ActionRecord = {
      action,
      playerId,
      timestamp: new Date().toISOString(),
      fromVersion: session.version,
    };

    // Check game end
    const result = adapter.checkResult(newState);

    // Update canonical state
    const updatedSession: GameState = {
      ...session,
      state: newState,
      version: session.version + 1,
      updatedAt: new Date().toISOString(),
      activePlayerId: result ? null : nextActivePlayerId,
      phase: result ? "completed" : session.phase,
      result: result ?? session.result,
      actionHistory: [...session.actionHistory, actionRecord],
    };

    this.sessions.set(sessionId, updatedSession);
    return { success: true, newState: updatedSession };
  }

  resetSession(sessionId: GameSessionId): GameState {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const adapter = this.adapterRegistry.get(session.gameType);
    const initialState = adapter.createInitialState();

    const updatedSession: GameState = {
      ...session,
      state: initialState,
      phase: "waiting",
      version: 0,
      updatedAt: new Date().toISOString(),
      activePlayerId: null,
      result: null,
      actionHistory: [],
    };

    this.sessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  deleteSession(sessionId: GameSessionId): void {
    this.sessions.delete(sessionId);
  }
}
