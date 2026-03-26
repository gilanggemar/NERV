// ============================================================
// lib/games/types.ts
// The universal game contract. Every game adapter implements
// these interfaces. Every agent consumes them.
// ============================================================

// --- Identity & Metadata ---

export type GameSessionId = string;
export type AgentId = string;
export type PlayerId = string;
export type GameType = "tic-tac-toe" | "neuroverse" | "chess" | "card-game" | string;

// --- Game State ---

export interface GameState<TState = unknown> {
  sessionId: GameSessionId;
  gameType: GameType;
  phase: GamePhase;
  version: number;
  updatedAt: string;
  state: TState;
  players: PlayerSlot[];
  activePlayerId: PlayerId | null;
  result: GameResult | null;
  actionHistory: ActionRecord[];
}

export type GamePhase =
  | "waiting"
  | "active"
  | "paused"
  | "completed";

export interface PlayerSlot {
  playerId: PlayerId;
  label: string;
  controller: PlayerController;
  agentId: AgentId | null;
}

export interface PlayerController {
  type: "agent" | "human" | "vacant";
  agentId?: AgentId;
}

export interface GameResult {
  outcome: "win" | "draw" | "forfeit" | "timeout" | "error";
  winnerId: PlayerId | null;
  reason: string;
}

export interface ActionRecord {
  action: GameAction;
  playerId: PlayerId;
  timestamp: string;
  fromVersion: number;
}

// --- Actions ---

export interface GameAction<TPayload = unknown> {
  type: string;
  payload: TPayload;
}

export interface ActionDescriptor<TPayload = unknown> {
  type: string;
  description: string;
  payloadSchema: Record<string, unknown>;
  validPayloads?: TPayload[];
}

// --- Observation ---

export interface AgentObservation<TState = unknown, TPayload = unknown> {
  gameState: GameState<TState>;
  yourPlayerId: PlayerId;
  isYourTurn: boolean;
  availableActions: ActionDescriptor<TPayload>[];
  metadata: Record<string, unknown>;
}

// --- Action Submission ---

export interface ActionSubmission<TPayload = unknown> {
  agentId: AgentId;
  sessionId: GameSessionId;
  observedVersion: number;
  action: GameAction<TPayload>;
}

export interface ActionResponse {
  success: boolean;
  error?: ActionError;
  newState?: GameState;
}

export interface ActionError {
  code:
    | "INVALID_ACTION"
    | "ILLEGAL_MOVE"
    | "NOT_YOUR_TURN"
    | "STALE_VERSION"
    | "GAME_NOT_ACTIVE"
    | "UNAUTHORIZED"
    | "RATE_LIMITED"
    | "TIMEOUT";
  message: string;
}
