// ============================================================
// lib/games/adapters/index.ts
// Exports all adapters + creates a pre-configured registry.
// ============================================================

import { AdapterRegistry } from "../adapter-registry";
import { TicTacToeAdapter } from "./tic-tac-toe";
import { NeuroverseAdapter } from "./neuroverse";

export { TicTacToeAdapter } from "./tic-tac-toe";
export { NeuroverseAdapter } from "./neuroverse";

export function createDefaultRegistry(): AdapterRegistry {
  const registry = new AdapterRegistry();
  registry.register(new TicTacToeAdapter());
  registry.register(new NeuroverseAdapter());
  return registry;
}
