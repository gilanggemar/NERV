// ============================================================
// lib/games/agent-gateway-bridge.ts
// Sends game state to a real OpenClaw agent via the gateway
// and parses the agent's move + optional commentary from
// the streamed response.
// ============================================================

import { getGateway } from "@/lib/openclawGateway";
import { TicTacToeState } from "./adapters/tic-tac-toe";
import { GameAction, GameType } from "./types";
import { getAiMove } from "./agents/simple-agent";

// Set to true to re-enable minimax fallback when agent is unavailable.
// Currently disabled so we can debug real agent responses.
const ENABLE_FALLBACK = false;

/**
 * Normalize a game type string into a session-safe slug (no dashes).
 * e.g. "tic-tac-toe" → "tictactoe", "card-game" → "cardgame"
 */
function gameSessionSlug(gameType: GameType): string {
  return gameType.replace(/-/g, "");
}

interface AgentMoveResult {
  action: GameAction<{ row: number; col: number }>;
  commentary: string | null;
  source: "agent" | "fallback";
}

/**
 * Encode a board into compact row-major format: "XOX/.O./X.O"
 */
function encodeBoard(board: (string | null)[][]): string {
  return board
    .map((row) => row.map((cell) => cell ?? ".").join(""))
    .join("/");
}

/**
 * Decode a compact board string back into a 3×3 array.
 * Returns null if the format is invalid.
 */
function decodeBoard(encoded: string): (string | null)[][] | null {
  // Clean up: strip whitespace, backticks, etc.
  const clean = encoded.trim().replace(/`/g, "");
  const rows = clean.split("/");
  if (rows.length !== 3) return null;

  const board: (string | null)[][] = [];
  for (const row of rows) {
    if (row.length !== 3) return null;
    board.push(
      [...row].map((ch) => {
        if (ch === "X" || ch === "x") return "X";
        if (ch === "O" || ch === "o") return "O";
        if (ch === ".") return null;
        return null; // treat unknown as empty
      })
    );
  }
  return board;
}

/**
 * Line labels and definitions for the 8 winning lines.
 */
const LINE_DEFS: { label: string; cells: [number, number][] }[] = [
  { label: "R1", cells: [[0,0],[0,1],[0,2]] },
  { label: "R2", cells: [[1,0],[1,1],[1,2]] },
  { label: "R3", cells: [[2,0],[2,1],[2,2]] },
  { label: "C1", cells: [[0,0],[1,0],[2,0]] },
  { label: "C2", cells: [[0,1],[1,1],[2,1]] },
  { label: "C3", cells: [[0,2],[1,2],[2,2]] },
  { label: "D\\", cells: [[0,0],[1,1],[2,2]] },
  { label: "D/", cells: [[0,2],[1,1],[2,0]] },
];

/**
 * Build a compact prompt for the agent.
 * Shows a labeled grid + all 8 winning lines as linear sequences,
 * so the LLM can naturally see patterns like "X . X" without
 * needing explicit threat instructions.
 */
function buildGamePrompt(
  state: TicTacToeState,
  agentPlayerId: string,
  agentName: string,
): string {
  const mark = agentPlayerId === "player-x" ? "X" : "O";
  const opp = mark === "X" ? "O" : "X";
  const b = state.board;
  const compact = encodeBoard(b);

  // Plain text board — no box-drawing noise, just the cells
  const row1 = `${b[0][0]??'.'} ${b[0][1]??'.'} ${b[0][2]??'.'}`;
  const row2 = `${b[1][0]??'.'} ${b[1][1]??'.'} ${b[1][2]??'.'}`;
  const row3 = `${b[2][0]??'.'} ${b[2][1]??'.'} ${b[2][2]??'.'}`;

  return `> [GAME] TicTacToe you=${mark} vs ${opp}. The board below is a 3×3 grid. Read it as a whole picture: row1 is the top, row3 is the bottom. Before you move, mentally check every row, column, and both diagonals for two-in-a-row threats. Reply: \`NEWBOARD|quip\` (1 new ${mark}). Be ${agentName}.

\`\`\`
${compact}
\`\`\`
row1: ${row1}
row2: ${row2}
row3: ${row3}`;
}

/**
 * Parse the agent's response.
 * Expected format: "XOX/.O./X.O|commentary" or just the board.
 * Finds the agent's move by diffing old board vs new board.
 */
function parseAgentResponse(
  text: string,
  oldBoard: (string | null)[][],
  agentMark: string,
): { row: number; col: number; commentary: string | null } | null {
  try {
    // Extract the board pattern from the response
    // Match something like XOX/.O./X.O (3 groups of 3 chars separated by /)
    const boardPattern = /([XOxo.]{3})\/([XOxo.]{3})\/([XOxo.]{3})/;

    // Try to find the board in the text (may be in code block, inline code, etc.)
    let cleaned = text.replace(/```[a-z]*\n?/g, "").replace(/```/g, "").trim();

    const match = cleaned.match(boardPattern);
    if (!match) return null;

    const boardStr = `${match[1]}/${match[2]}/${match[3]}`;
    const newBoard = decodeBoard(boardStr);
    if (!newBoard) return null;

    // Diff to find the new cell
    let diffRow = -1;
    let diffCol = -1;
    let diffCount = 0;

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (oldBoard[r][c] !== newBoard[r][c]) {
          diffRow = r;
          diffCol = c;
          diffCount++;
        }
      }
    }

    // Must have exactly one diff, and it must be the agent's mark placed on an empty cell
    if (diffCount !== 1) return null;
    if (oldBoard[diffRow][diffCol] !== null) return null;
    if (newBoard[diffRow][diffCol]?.toUpperCase() !== agentMark) return null;

    // Extract commentary after the board (separated by |)
    const pipeIdx = cleaned.indexOf(boardStr);
    const afterBoard = cleaned.slice(pipeIdx + boardStr.length);
    let commentary: string | null = null;

    // Try pipe separator
    const pipeMatch = afterBoard.match(/\|(.+)/);
    if (pipeMatch) {
      const say = pipeMatch[1].trim();
      if (say && say !== "null" && say !== "empty" && say.length > 0) {
        commentary = say;
      }
    }

    // Also try JSON fallback for "say" field (in case agent wraps it)
    if (!commentary) {
      const sayMatch = text.match(/"say"\s*:\s*"([^"]+)"/);
      if (sayMatch && sayMatch[1] !== "null") {
        commentary = sayMatch[1];
      }
    }

    return { row: diffRow, col: diffCol, commentary };
  } catch {
    return null;
  }
}

/**
 * Extract content string from various event payload shapes.
 */
function extractContent(val: unknown): string {
  if (typeof val === "string") return val;
  if (Array.isArray(val)) {
    return val
      .filter((b: any) => b.type === "text" || typeof b === "string")
      .map((b: any) => (typeof b === "string" ? b : b.text || ""))
      .join("");
  }
  return "";
}

/**
 * Check if text contains a board pattern (3chars/3chars/3chars).
 */
function hasBoardPattern(text: string): boolean {
  return /[XOxo.]{3}\/[XOxo.]{3}\/[XOxo.]{3}/.test(text);
}

/**
 * Request a move from the real OpenClaw agent.
 * Falls back to minimax if the gateway is offline or response is invalid.
 */
export async function requestAgentMove(
  state: TicTacToeState,
  agentPlayerId: string,
  agentId: string,
  agentName: string,
  gameType: GameType = "tic-tac-toe",
  timeoutMs = 15000
): Promise<AgentMoveResult> {
  const gw = getGateway();
  const agentMark = agentPlayerId === "player-x" ? "X" : "O";

  // Require gateway connection
  if (!gw.isConnected) {
    if (ENABLE_FALLBACK) {
      return { action: getAiMove(state, agentPlayerId), commentary: null, source: "fallback" };
    }
    throw new Error("[AgentBridge] Gateway not connected");
  }

  const sessionKey = `agent:${agentId}:ngames-${gameSessionSlug(gameType)}`;
  const prompt = buildGamePrompt(state, agentPlayerId, agentName);

  try {
    const sendResult = await gw.request("chat.send", {
      sessionKey,
      message: prompt,
      idempotencyKey: crypto.randomUUID(),
    });

    const runId = sendResult?.runId;
    console.log("[AgentBridge] sent, runId:", runId);

    const responseText = await new Promise<string>((resolve, reject) => {
      let chatText = "";
      let agentText = "";
      let resolved = false;

      const best = () => agentText.length >= chatText.length ? agentText : chatText;

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          unsubChat();
          unsubAgent();
          const t = best();
          if (t) resolve(t);
          else reject(new Error("Agent response timeout"));
        }
      }, timeoutMs);

      const done = (finalText: string) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        unsubChat();
        unsubAgent();
        resolve(finalText);
      };

      // --- chat events ---
      const unsubChat = gw.on("chat", (p: any) => {
        const pRunId = p?.runId ?? p?.requestId;
        if (runId && pRunId && pRunId !== runId) return;

        if (p.text) {
          const s = extractContent(p.text);
          if (s.length >= chatText.length) chatText = s;
        } else if (p.delta) {
          chatText += extractContent(p.delta);
        }
        if (p.message?.content) {
          const s = extractContent(p.message.content);
          if (s.length > chatText.length) chatText = s;
        }
        if (p.content && !p.message) {
          const s = extractContent(p.content);
          if (s.length > chatText.length) chatText = s;
        }

        const isDone =
          p?.state === "done" || p?.state === "stop" || p?.state === "complete" ||
          p?.state === "end" || p?.type === "done" || p?.type === "message_end" ||
          p?.done === true || p?.finished === true;

        if (isDone) {
          const t = best();
          if (t) done(t);
        }
      });

      // --- agent events ---
      const unsubAgent = gw.on("agent", (p: any) => {
        const pRunId = p?.runId;
        if (runId && pRunId && pRunId !== runId) return;

        if (p.stream === "assistant" && (p.data?.text || p.data?.delta)) {
          const s = p.data.text || p.data.delta;
          if (s.length >= agentText.length) agentText = s;
        }

        if (p.stream === "lifecycle" && p.data?.phase === "end") {
          const t = best();
          if (t) done(t);
        }
      });
    });

    // Parse the final response
    const parsed = parseAgentResponse(responseText, state.board, agentMark);
    if (parsed && state.board[parsed.row][parsed.col] === null) {
      console.log("[AgentBridge] ✅ Move:", parsed.row, parsed.col, "Say:", parsed.commentary);
      return {
        action: { type: "place_mark", payload: { row: parsed.row, col: parsed.col } },
        commentary: parsed.commentary,
        source: "agent",
      };
    }
    console.warn("[AgentBridge] ❌ Parse failed. Raw:", responseText.slice(0, 300));
    if (ENABLE_FALLBACK) {
      return { action: getAiMove(state, agentPlayerId), commentary: null, source: "fallback" };
    }
    throw new Error("[AgentBridge] Could not parse agent response");
  } catch (err) {
    console.error("[AgentBridge] Error:", err);
    if (ENABLE_FALLBACK) {
      return { action: getAiMove(state, agentPlayerId), commentary: null, source: "fallback" };
    }
    throw err;
  }
}
