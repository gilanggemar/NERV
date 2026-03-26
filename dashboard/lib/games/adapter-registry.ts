// ============================================================
// lib/games/adapter-registry.ts
// Manages all registered game adapters.
// ============================================================

import { GameAdapter } from "./game-adapter";
import { GameType } from "./types";

export class AdapterRegistry {
  private adapters = new Map<GameType, GameAdapter>();

  register(adapter: GameAdapter): void {
    if (this.adapters.has(adapter.gameType)) {
      throw new Error(`Adapter already registered for game type: ${adapter.gameType}`);
    }
    this.adapters.set(adapter.gameType, adapter);
  }

  get(gameType: GameType): GameAdapter {
    const adapter = this.adapters.get(gameType);
    if (!adapter) {
      throw new Error(`No adapter registered for game type: ${gameType}`);
    }
    return adapter;
  }

  list(): Array<{
    gameType: GameType;
    displayName: string;
    description: string;
    minPlayers: number;
    maxPlayers: number;
  }> {
    return Array.from(this.adapters.values()).map((a) => ({
      gameType: a.gameType,
      displayName: a.displayName,
      description: a.description,
      minPlayers: a.minPlayers,
      maxPlayers: a.maxPlayers,
    }));
  }
}
