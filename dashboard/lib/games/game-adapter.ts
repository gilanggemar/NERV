// ============================================================
// lib/games/game-adapter.ts
// The interface every game adapter must implement.
// ============================================================

import {
  GameAction, ActionDescriptor, GameResult,
  PlayerId, GameType, PlayerSlot
} from "./types";

export interface GameAdapter<TState = unknown, TAction = unknown> {
  readonly gameType: GameType;
  readonly displayName: string;
  readonly description: string;
  readonly minPlayers: number;
  readonly maxPlayers: number;

  createInitialState(config?: Record<string, unknown>): TState;

  createPlayerSlots(config?: Record<string, unknown>): Omit<PlayerSlot, "controller" | "agentId">[];

  getAvailableActions(state: TState, playerId: PlayerId): ActionDescriptor<TAction>[];

  validateAction(
    state: TState,
    playerId: PlayerId,
    action: GameAction<TAction>
  ): { valid: true } | { valid: false; reason: string };

  applyAction(
    state: TState,
    playerId: PlayerId,
    action: GameAction<TAction>
  ): {
    newState: TState;
    nextActivePlayerId: PlayerId | null;
  };

  checkResult(state: TState): GameResult | null;

  filterStateForPlayer(state: TState, playerId: PlayerId): TState;

  getRenderingHint(): string;
}
