// ============================================================
// lib/games/adapters/neuroverse.ts
// GameAdapter for Neuroverse (DRIFT rules, renamed).
// 1 human + up to 3 AI agents. Cyberpunk Monopoly.
// ============================================================

import { GameAdapter } from "../game-adapter";
import { GameAction, ActionDescriptor, GameResult, PlayerId, PlayerSlot } from "../types";
import {
  BOARD, BOARD as B, COLOR_GROUPS, ColorGroup, BUILD_COSTS, RENT_TABLE,
  MORTGAGE_VALUES, DATASTREAM_RENT, DATASTREAM_IDS, SERVER_IDS,
  NETRUNNERS, NetrunnerId, GLITCH_CARDS, SIGNAL_CARDS, GameCard,
  VOLTAGE_ABILITIES, BLACKOUT_ROUNDS, DOMINANCE_THRESHOLD,
  MAX_ROUNDS, MAX_VOLTAGE, STARTING_CRED, STARTING_VOLTAGE,
  SALARY, FIREWALL_EXIT_FEE, TOLL_ZONE_FEE, MAX_NODES_PER_DISTRICT,
  SYSTEM_CRASH_POSITION, BoardSpace,
} from "./neuroverse-data";

// --- State Types ---

export interface PropertyState {
  ownerId: string | null;
  nodes: number;     // 0-3
  hasTower: boolean;
  hasMegaframe: boolean;
  mortgaged: boolean;
}

export interface NeuroversePlayer {
  id: string;
  cred: number;
  voltage: number;
  position: number;
  netrunner: NetrunnerId;
  inFirewall: boolean;
  firewallTurns: number; // attempts to escape
  hasRebooted: boolean;
  rebootShield: boolean; // no rent until passing BOOT UP
  activeUsed: boolean; // netrunner active ability used
  heldCards: string[]; // "escape_firewall", "vpn_shield", "half_rent"
  noVoltageNextTurn: boolean;
  rentBoostThisRound: number; // extra rent from Proxy Server card
  passedBootUp: boolean; // track if passed BOOT UP this lap (for reboot shield)
}

export interface AuctionState {
  propertyId: number;
  bids: Record<string, number>; // playerId → bid
  currentBidderId: string | null;
  highestBid: number;
  highestBidder: string | null;
  passed: string[]; // players who passed
}

export type TurnPhase =
  | "roll"           // need to roll dice
  | "choose_die"     // rolled, pick which die
  | "resolve_space"  // landed, resolve (buy/rent/card)
  | "auction"        // property auction in progress
  | "build"          // optional build phase
  | "voltage"        // optional voltage spend
  | "end_turn";      // end turn

export interface NeuroverseState {
  board: PropertyState[];     // 28 entries
  players: NeuroversePlayer[];
  turnOrder: string[];        // player IDs in order
  activePlayerIndex: number;
  turnPhase: TurnPhase;
  round: number;
  maxRounds: number;
  dice: [number, number] | null;
  chosenDie: number | null;
  glitchDeck: number[];       // card IDs, shuffled
  signalDeck: number[];
  glitchDiscard: number[];
  signalDiscard: number[];
  auction: AuctionState | null;
  lastCardDrawn: GameCard | null;
  lastEvent: string | null;
  gameLog: string[];
  playerCount: number;
  blackoutTriggered: number[]; // rounds already triggered
  netrunnerAssignments: Record<string, NetrunnerId>;
}

// --- Helpers ---

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getColorGroup(spaceId: number): ColorGroup | null {
  for (const [color, ids] of Object.entries(COLOR_GROUPS)) {
    if (ids.includes(spaceId)) return color as ColorGroup;
  }
  return null;
}

function ownsFullGroup(board: PropertyState[], playerId: string, color: ColorGroup): boolean {
  return COLOR_GROUPS[color].every(id => board[id]?.ownerId === playerId);
}

function countDatastreams(board: PropertyState[], playerId: string): number {
  return DATASTREAM_IDS.filter(id => board[id]?.ownerId === playerId).length;
}

function countServers(board: PropertyState[], playerId: string): number {
  return SERVER_IDS.filter(id => board[id]?.ownerId === playerId).length;
}

function getBuildingLevel(prop: PropertyState): number {
  if (prop.hasMegaframe) return 6; // megaframe
  if (prop.hasTower) return 5;     // tower
  return prop.nodes + 2;          // 2=base(sectorLock), 3=1node, 4=2node, 5=3node — wait, let me fix
}

function getRentIndex(prop: PropertyState, hasSectorLock: boolean): number {
  if (prop.hasMegaframe) return 6;
  if (prop.hasTower) return 5;
  if (prop.nodes > 0) return 1 + prop.nodes; // 2=1node,3=2node,4=3node
  if (hasSectorLock) return 1;
  return 0;
}

function calculateRent(
  board: PropertyState[],
  spaceId: number,
  space: BoardSpace,
  dice: [number, number] | null,
  _landingPlayer: NeuroversePlayer,
  owner: NeuroversePlayer,
): number {
  const prop = board[spaceId];
  if (!prop || prop.mortgaged) return 0;

  if (space.type === "datastream") {
    const count = countDatastreams(board, owner.id);
    return DATASTREAM_RENT[count] || 0;
  }

  if (space.type === "server") {
    const count = countServers(board, owner.id);
    const diceTotal = dice ? dice[0] + dice[1] : 7;
    return count === 2 ? diceTotal * 12 : diceTotal * 5;
  }

  if (space.type === "district") {
    const rentArr = RENT_TABLE[spaceId];
    if (!rentArr) return 0;
    const color = getColorGroup(spaceId);
    const hasSectorLock = color ? ownsFullGroup(board, owner.id, color) : false;
    const idx = getRentIndex(prop, hasSectorLock);
    let rent = rentArr[idx] || 0;
    rent += owner.rentBoostThisRound;
    return rent;
  }

  return 0;
}

function getNetWorth(player: NeuroversePlayer, board: PropertyState[]): number {
  let total = player.cred;
  for (let i = 0; i < board.length; i++) {
    const prop = board[i];
    if (prop?.ownerId === player.id) {
      const space = BOARD[i];
      total += space.price || 0;
      if (prop.nodes > 0) {
        const color = getColorGroup(i);
        if (color) total += prop.nodes * BUILD_COSTS[color][0];
      }
      if (prop.hasTower) {
        const color = getColorGroup(i);
        if (color) total += BUILD_COSTS[color][1];
      }
      if (prop.hasMegaframe) {
        const color = getColorGroup(i);
        if (color) total += BUILD_COSTS[color][2];
      }
    }
  }
  return total;
}

function countCompletedColorGroups(board: PropertyState[], playerId: string): number {
  let count = 0;
  for (const color of Object.keys(COLOR_GROUPS) as ColorGroup[]) {
    if (ownsFullGroup(board, playerId, color)) count++;
  }
  return count;
}

function totalPropertyValue(board: PropertyState[], playerId: string): number {
  let total = 0;
  for (let i = 0; i < board.length; i++) {
    if (board[i]?.ownerId === playerId) {
      total += BOARD[i].price || 0;
    }
  }
  return total;
}

function hasMegaframe(board: PropertyState[], playerId: string): boolean {
  return board.some(p => p?.ownerId === playerId && p.hasMegaframe);
}

function calcGridScore(player: NeuroversePlayer, board: PropertyState[]): number {
  let score = 0;
  score += Math.floor(player.cred / 50);
  score += player.voltage;
  for (let i = 0; i < board.length; i++) {
    const prop = board[i];
    if (prop?.ownerId !== player.id) continue;
    const space = BOARD[i];
    if (space.type === "district") score += 2;
    if (space.type === "datastream") score += 3;
    if (space.type === "server") score += 3;
    score += prop.nodes;
    if (prop.hasTower) score += 3;
    if (prop.hasMegaframe) score += 6;
    if (prop.mortgaged) score -= 2;
  }
  return score;
}

// --- Adapter ---

export class NeuroverseAdapter implements GameAdapter<NeuroverseState, unknown> {
  readonly gameType = "neuroverse" as const;
  readonly displayName = "Neuroverse";
  readonly description = "Cyberpunk Monopoly. Own the grid. Hack the system. Rule the night.";
  readonly minPlayers = 2;
  readonly maxPlayers = 4;

  createInitialState(config?: Record<string, unknown>): NeuroverseState {
    const playerCount = (config?.playerCount as number) || 4;
    const startingCred = (config?.startingCred as number) || STARTING_CRED;
    const startingVoltage = (config?.startingVoltage as number) || STARTING_VOLTAGE;
    const maxRounds = (config?.maxRounds as number) || MAX_ROUNDS;
    const salary = (config?.salary as number) || SALARY;
    const playerIds: string[] = [];
    for (let i = 0; i < playerCount; i++) playerIds.push(`player-${i + 1}`);

    // Assign netrunners: use explicit assignments from config, or random
    const explicitRunners = config?.netrunnerAssignments as Record<string, NetrunnerId> | undefined;
    const shuffledRunners = shuffle(NETRUNNERS.map(n => n.id));
    const assignments: Record<string, NetrunnerId> = {};
    playerIds.forEach((pid, i) => {
      assignments[pid] = explicitRunners?.[pid] || shuffledRunners[i % shuffledRunners.length];
    });

    const players: NeuroversePlayer[] = playerIds.map(id => ({
      id,
      cred: startingCred,
      voltage: startingVoltage,
      position: 0,
      netrunner: assignments[id],
      inFirewall: false,
      firewallTurns: 0,
      hasRebooted: false,
      rebootShield: false,
      activeUsed: false,
      heldCards: [],
      noVoltageNextTurn: false,
      rentBoostThisRound: 0,
      passedBootUp: false,
    }));

    const board: PropertyState[] = BOARD.map(() => ({
      ownerId: null,
      nodes: 0,
      hasTower: false,
      hasMegaframe: false,
      mortgaged: false,
    }));

    return {
      board,
      players,
      turnOrder: playerIds,
      activePlayerIndex: 0,
      turnPhase: "roll",
      round: 1,
      maxRounds: maxRounds,
      dice: null,
      chosenDie: null,
      glitchDeck: shuffle(GLITCH_CARDS.map(c => c.id)),
      signalDeck: shuffle(SIGNAL_CARDS.map(c => c.id)),
      glitchDiscard: [],
      signalDiscard: [],
      auction: null,
      lastCardDrawn: null,
      lastEvent: null,
      gameLog: [],
      playerCount,
      blackoutTriggered: [],
      netrunnerAssignments: assignments,
    };
  }

  createPlayerSlots(config?: Record<string, unknown>): Omit<PlayerSlot, "controller" | "agentId">[] {
    const count = (config?.playerCount as number) || 4;
    const labels = ["Alpha", "Beta", "Gamma", "Delta"];
    return Array.from({ length: count }, (_, i) => ({
      playerId: `player-${i + 1}`,
      label: labels[i] || `P${i + 1}`,
    }));
  }

  getAvailableActions(state: NeuroverseState, playerId: PlayerId): ActionDescriptor[] {
    const player = state.players.find(p => p.id === playerId);
    if (!player) return [];
    const actions: ActionDescriptor[] = [];

    switch (state.turnPhase) {
      case "roll":
        if (player.inFirewall) {
          actions.push({ type: "exit_firewall", description: "Pay ¢50 to exit Firewall", payloadSchema: { method: { enum: ["pay", "roll", "card"] } } });
        } else {
          actions.push({ type: "roll_dice", description: "Roll both dice", payloadSchema: {} });
        }
        break;

      case "choose_die":
        if (state.dice) {
          actions.push({
            type: "choose_die",
            description: "Choose which die to use for movement",
            payloadSchema: { die: { enum: [0, 1] } },
          });
        }
        break;

      case "resolve_space": {
        const space = BOARD[player.position];
        const prop = state.board[player.position];
        if (space && prop && !prop.ownerId && space.price) {
          actions.push({ type: "buy_property", description: `Buy ${space.name} for ¢${space.price}`, payloadSchema: {} });
          actions.push({ type: "decline_buy", description: "Decline to buy (auction)", payloadSchema: {} });
        } else {
          actions.push({ type: "end_resolve", description: "Continue", payloadSchema: {} });
        }
        if (space?.type === "corner" && space.cornerKind === "toll_zone") {
          actions.push({ type: "toll_choice", description: "Pay ¢50 or draw SIGNAL", payloadSchema: { choice: { enum: ["pay", "draw"] } } });
        }
        break;
      }

      case "auction":
        if (state.auction) {
          actions.push({ type: "auction_bid", description: "Place bid", payloadSchema: { amount: { type: "number" } } });
          actions.push({ type: "auction_pass", description: "Pass on auction", payloadSchema: {} });
        }
        break;

      case "build": {
        // List buildable properties
        for (const [color, ids] of Object.entries(COLOR_GROUPS) as [ColorGroup, number[]][]) {
          if (!ownsFullGroup(state.board, playerId, color)) continue;
          if (ids.some(id => state.board[id]?.mortgaged)) continue;
          for (const id of ids) {
            const prop = state.board[id];
            if (!prop || prop.hasMegaframe) continue;
            actions.push({
              type: "build",
              description: `Build on ${BOARD[id].name}`,
              payloadSchema: { spaceId: { const: id } },
            });
          }
        }
        actions.push({ type: "skip_build", description: "Skip building", payloadSchema: {} });
        break;
      }

      case "voltage":
        if (!player.noVoltageNextTurn && player.voltage > 0) {
          for (const [ability, info] of Object.entries(VOLTAGE_ABILITIES)) {
            if (player.voltage >= info.cost) {
              actions.push({ type: "spend_voltage", description: info.desc, payloadSchema: { ability: { const: ability } } });
            }
          }
        }
        actions.push({ type: "skip_voltage", description: "Skip voltage", payloadSchema: {} });
        break;

      case "end_turn":
        actions.push({ type: "end_turn", description: "End turn", payloadSchema: {} });
        break;
    }

    return actions;
  }

  validateAction(
    state: NeuroverseState,
    playerId: PlayerId,
    action: GameAction,
  ): { valid: true } | { valid: false; reason: string } {
    const player = state.players.find(p => p.id === playerId);
    if (!player) return { valid: false, reason: "Player not found" };

    const activeId = state.turnOrder[state.activePlayerIndex];
    // Auction can involve non-active players
    if (state.turnPhase !== "auction" && playerId !== activeId) {
      return { valid: false, reason: "Not your turn" };
    }

    switch (action.type) {
      case "roll_dice":
        if (state.turnPhase !== "roll") return { valid: false, reason: "Not roll phase" };
        if (player.inFirewall) return { valid: false, reason: "In Firewall, use exit_firewall" };
        return { valid: true };

      case "exit_firewall":
        if (!player.inFirewall) return { valid: false, reason: "Not in Firewall" };
        return { valid: true };

      case "choose_die":
        if (state.turnPhase !== "choose_die") return { valid: false, reason: "Not choose_die phase" };
        return { valid: true };

      case "buy_property": {
        if (state.turnPhase !== "resolve_space") return { valid: false, reason: "Not resolve phase" };
        const space = BOARD[player.position];
        const prop = state.board[player.position];
        if (!space?.price || prop?.ownerId) return { valid: false, reason: "Cannot buy" };
        let cost = space.price;
        if (player.netrunner === "proxy") cost = Math.floor(cost * 0.8 / 5) * 5;
        if (player.cred < cost) return { valid: false, reason: "Not enough CRED" };
        return { valid: true };
      }

      case "decline_buy":
        if (state.turnPhase !== "resolve_space") return { valid: false, reason: "Not resolve phase" };
        return { valid: true };

      case "auction_bid":
        if (state.turnPhase !== "auction" || !state.auction) return { valid: false, reason: "No auction" };
        return { valid: true };

      case "auction_pass":
        if (state.turnPhase !== "auction") return { valid: false, reason: "No auction" };
        return { valid: true };

      case "build":
      case "skip_build":
        if (state.turnPhase !== "build") return { valid: false, reason: "Not build phase" };
        return { valid: true };

      case "spend_voltage":
      case "skip_voltage":
        if (state.turnPhase !== "voltage") return { valid: false, reason: "Not voltage phase" };
        return { valid: true };

      case "end_turn":
      case "end_resolve":
        return { valid: true };

      case "toll_choice":
        return { valid: true };

      default:
        return { valid: false, reason: `Unknown action: ${action.type}` };
    }
  }

  applyAction(
    state: NeuroverseState,
    playerId: PlayerId,
    action: GameAction,
  ): { newState: NeuroverseState; nextActivePlayerId: PlayerId | null } {
    // Deep clone state
    const s: NeuroverseState = JSON.parse(JSON.stringify(state));
    const pi = s.players.findIndex(p => p.id === playerId);
    const player = s.players[pi];
    const log = (msg: string) => s.gameLog.push(msg);

    switch (action.type) {
      case "roll_dice": {
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        s.dice = [d1, d2];
        log(`${playerId} rolled [${d1},${d2}]`);
        // Doubles bonus: gain 1 voltage
        if (d1 === d2) {
          player.voltage = Math.min(MAX_VOLTAGE, player.voltage + 1);
          log(`${playerId} +1V (doubles)`);
        }
        s.turnPhase = "choose_die";
        break;
      }

      case "exit_firewall": {
        const method = (action.payload as any)?.method || "pay";
        if (method === "card" && player.heldCards.includes("escape_firewall")) {
          player.heldCards = player.heldCards.filter(c => c !== "escape_firewall");
          player.inFirewall = false;
          player.firewallTurns = 0;
          log(`${playerId} used Escape card`);
          s.turnPhase = "roll";
        } else if (method === "pay" && player.cred >= FIREWALL_EXIT_FEE) {
          player.cred -= FIREWALL_EXIT_FEE;
          player.inFirewall = false;
          player.firewallTurns = 0;
          log(`${playerId} paid ¢50 to exit Firewall`);
          s.turnPhase = "roll";
        } else {
          // Attempt roll doubles
          const d1 = Math.floor(Math.random() * 6) + 1;
          const d2 = Math.floor(Math.random() * 6) + 1;
          s.dice = [d1, d2];
          if (d1 === d2) {
            player.inFirewall = false;
            player.firewallTurns = 0;
            // Move by the doubles value
            const move = d1 + d2;
            player.position = (player.position + move) % BOARD.length;
            log(`${playerId} rolled doubles [${d1},${d2}], escaped Firewall`);
            s.turnPhase = "resolve_space";
            this._resolveSpace(s, player);
          } else {
            player.firewallTurns++;
            log(`${playerId} failed escape (${player.firewallTurns}/2)`);
            if (player.firewallTurns >= 2) {
              player.cred -= Math.min(player.cred, FIREWALL_EXIT_FEE);
              player.inFirewall = false;
              player.firewallTurns = 0;
              log(`${playerId} forced exit, paid ¢50`);
            }
            s.turnPhase = "end_turn";
          }
        }
        break;
      }

      case "choose_die": {
        const dieIndex = (action.payload as any)?.die ?? 0;
        const move = s.dice ? s.dice[dieIndex] || s.dice[0] : 3;
        s.chosenDie = move;
        const oldPos = player.position;
        player.position = (oldPos + move) % BOARD.length;
        // Check passing BOOT UP
        if (player.position < oldPos || (oldPos + move) >= BOARD.length) {
          player.cred += player.netrunner === "cipher" ? 250 : SALARY;
          player.voltage = Math.min(MAX_VOLTAGE, player.voltage + 1);
          log(`${playerId} passed BOOT UP +¢${player.netrunner === "cipher" ? 250 : 200} +1V`);
          if (player.rebootShield) {
            player.rebootShield = false;
            log(`${playerId} reboot shield expired`);
          }
        }
        log(`${playerId} moved to ${BOARD[player.position]?.name || "?"} (${move})`);
        s.turnPhase = "resolve_space";
        this._resolveSpace(s, player);
        break;
      }

      case "buy_property": {
        const space = BOARD[player.position];
        let cost = space.price || 0;
        if (player.netrunner === "proxy") cost = Math.floor(cost * 0.8 / 5) * 5;
        player.cred -= cost;
        s.board[player.position].ownerId = player.id;
        log(`${playerId} bought ${space.name} for ¢${cost}`);
        // Check if completing a color group
        const color = getColorGroup(player.position);
        if (color && ownsFullGroup(s.board, player.id, color)) {
          player.voltage = Math.min(MAX_VOLTAGE, player.voltage + 1);
          log(`${playerId} completed ${color} group! +1V`);
        }
        s.turnPhase = "build";
        break;
      }

      case "decline_buy": {
        // Start auction
        s.auction = {
          propertyId: player.position,
          bids: {},
          currentBidderId: s.turnOrder[0],
          highestBid: 0,
          highestBidder: null,
          passed: [],
        };
        s.turnPhase = "auction";
        log(`${BOARD[player.position]?.name} goes to auction`);
        break;
      }

      case "auction_bid": {
        if (!s.auction) break;
        const amount = (action.payload as any)?.amount || (s.auction.highestBid + 5);
        if (amount > s.auction.highestBid && player.cred >= amount) {
          s.auction.bids[playerId] = amount;
          s.auction.highestBid = amount;
          s.auction.highestBidder = playerId;
          log(`${playerId} bid ¢${amount}`);
        }
        this._advanceAuction(s);
        break;
      }

      case "auction_pass": {
        if (!s.auction) break;
        if (!s.auction.passed.includes(playerId)) {
          s.auction.passed.push(playerId);
          log(`${playerId} passed on auction`);
        }
        this._advanceAuction(s);
        break;
      }

      case "build": {
        const spaceId = (action.payload as any)?.spaceId;
        if (spaceId == null) { s.turnPhase = "voltage"; break; }
        const prop = s.board[spaceId];
        const color = getColorGroup(spaceId);
        if (!color || !prop || prop.ownerId !== playerId) { break; }
        const [nodeCost, towerCost, megaCost] = BUILD_COSTS[color];
        const discount = player.netrunner === "nova" ? 0.8 : 1;

        if (!prop.hasTower && !prop.hasMegaframe && prop.nodes < MAX_NODES_PER_DISTRICT) {
          const cost = Math.floor(nodeCost * discount);
          if (player.cred >= cost) {
            player.cred -= cost;
            prop.nodes++;
            log(`${playerId} built Node on ${BOARD[spaceId].name} (¢${cost})`);
          }
        } else if (prop.nodes >= MAX_NODES_PER_DISTRICT && !prop.hasTower) {
          const cost = Math.floor(towerCost * discount);
          if (player.cred >= cost) {
            player.cred -= cost;
            prop.nodes = 0;
            prop.hasTower = true;
            log(`${playerId} built Tower on ${BOARD[spaceId].name} (¢${cost})`);
          }
        } else if (prop.hasTower && !prop.hasMegaframe) {
          const cost = Math.floor(megaCost * discount);
          if (player.cred >= cost) {
            player.cred -= cost;
            prop.hasTower = false;
            prop.hasMegaframe = true;
            log(`${playerId} built Megaframe on ${BOARD[spaceId].name} (¢${cost})`);
          }
        }
        // Stay in build phase for more building
        break;
      }

      case "skip_build":
        s.turnPhase = "voltage";
        break;

      case "spend_voltage": {
        const ability = (action.payload as any)?.ability;
        const info = VOLTAGE_ABILITIES[ability];
        if (!info || player.voltage < info.cost || player.noVoltageNextTurn) break;
        player.voltage -= info.cost;
        log(`${playerId} used ${ability} (-${info.cost}V)`);

        if (ability === "reroll") {
          // Re-roll both dice and go back to choose_die phase
          const rd1 = Math.floor(Math.random() * 6) + 1;
          const rd2 = Math.floor(Math.random() * 6) + 1;
          s.dice = [rd1, rd2];
          log(`${playerId} rerolled → [${rd1},${rd2}]`);
          if (rd1 === rd2) {
            player.voltage = Math.min(MAX_VOLTAGE, player.voltage + 1);
            log(`${playerId} +1V (doubles)`);
          }
          s.turnPhase = "choose_die";
        } else {
          s.lastEvent = `${playerId} used ${ability}`;
        }
        break;
      }

      case "skip_voltage":
        s.turnPhase = "end_turn";
        break;

      case "toll_choice": {
        const choice = (action.payload as any)?.choice || "pay";
        if (choice === "draw") {
          this._drawSignal(s, player);
        } else {
          player.cred -= Math.min(player.cred, TOLL_ZONE_FEE);
          log(`${playerId} paid ¢50 toll`);
        }
        s.turnPhase = "build";
        break;
      }

      case "end_resolve":
        s.turnPhase = "build";
        break;

      case "end_turn": {
        player.noVoltageNextTurn = false;
        player.rentBoostThisRound = 0;
        // Advance to next player
        s.activePlayerIndex = (s.activePlayerIndex + 1) % s.players.length;
        // If we've gone full circle, advance round
        if (s.activePlayerIndex === 0) {
          s.round++;
          log(`--- Round ${s.round} ---`);
          // Check blackout
          const triggers = BLACKOUT_ROUNDS[s.playerCount] || [];
          if (triggers.includes(s.round) && !s.blackoutTriggered.includes(s.round)) {
            s.blackoutTriggered.push(s.round);
            this._triggerBlackout(s);
          }
        }
        s.turnPhase = "roll";
        s.dice = null;
        s.chosenDie = null;
        s.lastCardDrawn = null;
        break;
      }
    }

    const result = this.checkResult(s);
    const nextPlayer = result ? null : s.turnOrder[s.activePlayerIndex];
    return { newState: s, nextActivePlayerId: nextPlayer };
  }

  // --- Internal Helpers ---

  private _resolveSpace(s: NeuroverseState, player: NeuroversePlayer): void {
    const space = BOARD[player.position];
    if (!space) return;

    switch (space.type) {
      case "corner":
        if (space.cornerKind === "boot_up") {
          player.voltage = Math.min(MAX_VOLTAGE, player.voltage + 1); // extra V for landing exactly
          s.gameLog.push(`${player.id} landed on BOOT UP +1V extra`);
          s.turnPhase = "build";
        } else if (space.cornerKind === "firewall") {
          s.turnPhase = "build"; // just visiting
        } else if (space.cornerKind === "toll_zone") {
          // Will be resolved by toll_choice action
          s.turnPhase = "resolve_space";
          s.lastEvent = "toll_zone";
        } else if (space.cornerKind === "system_crash") {
          player.position = 14; // FIREWALL position
          player.inFirewall = true;
          s.gameLog.push(`${player.id} hit SYSTEM CRASH → FIREWALL`);
          s.turnPhase = "end_turn";
        }
        break;

      case "glitch":
        this._drawGlitch(s, player);
        s.turnPhase = "build";
        break;

      case "signal":
        this._drawSignal(s, player);
        s.turnPhase = "build";
        break;

      case "district":
      case "datastream":
      case "server": {
        const prop = s.board[player.position];
        if (prop.ownerId && prop.ownerId !== player.id && !prop.mortgaged) {
          // Pay rent
          if (player.rebootShield) {
            s.gameLog.push(`${player.id} shielded from rent (reboot)`);
            s.turnPhase = "build";
          } else if (player.heldCards.includes("vpn_shield")) {
            player.heldCards = player.heldCards.filter(c => c !== "vpn_shield");
            s.gameLog.push(`${player.id} used VPN Shield, no rent`);
            s.turnPhase = "build";
          } else {
            const owner = s.players.find(p => p.id === prop.ownerId)!;
            let rent = calculateRent(s.board, player.position, space, s.dice, player, owner);
            // half_rent card: owner's next collection halved
            if (owner.heldCards.includes("half_rent")) {
              rent = Math.floor(rent / 2);
              owner.heldCards = owner.heldCards.filter(c => c !== "half_rent");
              s.gameLog.push(`${owner.id} rent halved (Packet Loss)`);
            }
            // GLITCH char passive: opponent loses 1V when paying rent
            if (player.netrunner === "glitch_char" && owner.voltage > 0) {
              owner.voltage--;
              s.gameLog.push(`${owner.id} -1V (GLITCH passive)`);
            }
            const paid = Math.min(player.cred, rent);
            player.cred -= paid;
            owner.cred += paid;
            s.gameLog.push(`${player.id} paid ¢${paid} rent to ${owner.id} on ${space.name}`);
            if (player.cred <= 0) {
              this._handleBankruptcy(s, player, owner);
            }
            s.turnPhase = "build";
          }
        } else if (!prop.ownerId && space.price) {
          // Unowned — resolve_space will let player buy/decline
          s.turnPhase = "resolve_space";
        } else {
          s.turnPhase = "build";
        }
        break;
      }
    }
  }

  private _drawGlitch(s: NeuroverseState, player: NeuroversePlayer): void {
    if (s.glitchDeck.length === 0) {
      s.glitchDeck = shuffle(s.glitchDiscard);
      s.glitchDiscard = [];
    }
    const cardId = s.glitchDeck.shift()!;
    const card = GLITCH_CARDS.find(c => c.id === cardId)!;
    s.lastCardDrawn = card;

    // ECHO passive: swap GLITCH for SIGNAL
    if (player.netrunner === "echo") {
      s.gameLog.push(`${player.id} drew GLITCH: ${card.name} — ECHO passive swapped it for a SIGNAL card!`);
      s.glitchDiscard.push(cardId);
      this._drawSignal(s, player);
      return;
    }

    s.gameLog.push(`${player.id} drew GLITCH: ${card.name} — ${card.description}`);
    this._applyCardEffect(s, player, card, "glitch");
    s.glitchDiscard.push(cardId);
  }

  private _drawSignal(s: NeuroverseState, player: NeuroversePlayer): void {
    if (s.signalDeck.length === 0) {
      s.signalDeck = shuffle(s.signalDiscard);
      s.signalDiscard = [];
    }
    const cardId = s.signalDeck.shift()!;
    const card = SIGNAL_CARDS.find(c => c.id === cardId)!;
    s.lastCardDrawn = card;
    s.gameLog.push(`${player.id} drew SIGNAL: ${card.name} — ${card.description}`);
    this._applyCardEffect(s, player, card, "signal");
    s.signalDiscard.push(cardId);
  }

  private _applyCardEffect(s: NeuroverseState, player: NeuroversePlayer, card: GameCard, _deck: string): void {
    const effects = card.effect.split(",");
    for (const effect of effects) {
      const [cmd, ...args] = effect.split(":");
      switch (cmd) {
        case "goto_firewall":
          player.position = 14;
          player.inFirewall = true;
          break;
        case "pay_bank":
          player.cred -= Math.min(player.cred, parseInt(args[0]));
          break;
        case "gain_cred":
          player.cred += parseInt(args[0]);
          break;
        case "gain_voltage":
          player.voltage = Math.min(MAX_VOLTAGE, player.voltage + parseInt(args[0]));
          break;
        case "lose_voltage":
          player.voltage = Math.max(0, player.voltage - parseInt(args[0]));
          break;
        case "escape_firewall_card":
          player.heldCards.push("escape_firewall");
          break;
        case "rent_shield":
          player.heldCards.push("vpn_shield");
          break;
        case "goto_boot_up":
          player.position = 0;
          player.cred += player.netrunner === "cipher" ? 250 : SALARY;
          player.voltage = Math.min(MAX_VOLTAGE, player.voltage + 1);
          break;
        case "collect_from_each":
          const amt = parseInt(args[0]);
          for (const p of s.players) {
            if (p.id !== player.id) {
              const take = Math.min(p.cred, amt);
              p.cred -= take;
              player.cred += take;
            }
          }
          break;
        case "pay_each_player":
          const payAmt = parseInt(args[0]);
          for (const p of s.players) {
            if (p.id !== player.id) {
              const give = Math.min(player.cred, payAmt);
              player.cred -= give;
              p.cred += give;
            }
          }
          break;
        case "gain_per_property":
          const perProp = parseInt(args[0]);
          let propCount = 0;
          for (const prop of s.board) {
            if (prop.ownerId === player.id) propCount++;
          }
          player.cred += propCount * perProp;
          break;
        case "goto_space":
          player.position = parseInt(args[0]);
          break;
        case "move_back":
          player.position = (player.position - parseInt(args[0]) + BOARD.length) % BOARD.length;
          break;
        case "no_voltage_next_turn":
          player.noVoltageNextTurn = true;
          break;
        case "rent_boost":
          player.rentBoostThisRound += parseInt(args[0]);
          break;
        case "building_tax": {
          const [nCost, tCost, mCost] = args.map(Number);
          let tax = 0;
          for (const prop of s.board) {
            if (prop.ownerId === player.id) {
              tax += prop.nodes * nCost;
              if (prop.hasTower) tax += tCost;
              if (prop.hasMegaframe) tax += mCost;
            }
          }
          player.cred -= Math.min(player.cred, tax);
          break;
        }
        case "megaframe_tax": {
          const perMf = parseInt(args[0]);
          let mfCount = 0;
          for (const prop of s.board) {
            if (prop.ownerId === player.id && prop.hasMegaframe) mfCount++;
          }
          player.cred -= Math.min(player.cred, mfCount * perMf);
          break;
        }
        case "free_node": {
          // Place 1 free Node on first eligible district the player owns in a complete group
          let placed = false;
          for (const [color, ids] of Object.entries(COLOR_GROUPS) as [ColorGroup, number[]][]) {
            if (!ids.every(id => s.board[id]?.ownerId === player.id)) continue;
            for (const id of ids) {
              const prop = s.board[id];
              if (prop && !prop.hasTower && !prop.hasMegaframe && prop.nodes < MAX_NODES_PER_DISTRICT) {
                prop.nodes++;
                s.gameLog.push(`${player.id} placed free Node on ${BOARD[id].name}`);
                placed = true;
                break;
              }
            }
            if (placed) break;
          }
          if (!placed) {
            s.gameLog.push(`${player.id} had no eligible property for free Node`);
          }
          break;
        }
        case "half_next_rent": {
          player.heldCards.push("half_rent");
          s.gameLog.push(`${player.id} next rent collection will be halved`);
          break;
        }
        case "ransomware": {
          // Richest opponent pays ¢50
          const others = s.players.filter(p => p.id !== player.id).sort((a, b) => b.cred - a.cred);
          if (others.length > 0) {
            const target = others[0];
            const take = Math.min(target.cred, 50);
            target.cred -= take;
            player.cred += take;
            s.gameLog.push(`${player.id} ransomware: ${target.id} paid ¢${take}`);
          }
          break;
        }
        case "discard_escape_cards": {
          const removed = player.heldCards.filter(c => c === "escape_firewall").length;
          player.heldCards = player.heldCards.filter(c => c !== "escape_firewall");
          if (removed > 0) s.gameLog.push(`${player.id} discarded ${removed} Escape card(s)`);
          break;
        }
        case "remove_node_from_target": {
          // Remove 1 Node from richest opponent's first property that has nodes
          const targets = s.players.filter(p => p.id !== player.id).sort((a, b) => b.cred - a.cred);
          let removed = false;
          for (const target of targets) {
            for (let i = 0; i < s.board.length; i++) {
              const prop = s.board[i];
              if (prop.ownerId === target.id && prop.nodes > 0) {
                prop.nodes--;
                s.gameLog.push(`${player.id} removed a Node from ${target.id}'s ${BOARD[i].name}`);
                removed = true;
                break;
              }
            }
            if (removed) break;
          }
          break;
        }
        case "goto_nearest_datastream_double": {
          // Move to nearest datastream, if owned pay double rent
          let nearestDs = -1;
          let minDist = 999;
          for (const dsId of DATASTREAM_IDS) {
            const dist = (dsId - player.position + BOARD.length) % BOARD.length;
            if (dist > 0 && dist < minDist) { minDist = dist; nearestDs = dsId; }
          }
          if (nearestDs >= 0) {
            const oldPos = player.position;
            player.position = nearestDs;
            // Check if passed BOOT UP
            if (nearestDs < oldPos) {
              player.cred += player.netrunner === "cipher" ? 250 : SALARY;
              player.voltage = Math.min(MAX_VOLTAGE, player.voltage + 1);
              s.gameLog.push(`${player.id} passed BOOT UP`);
            }
            s.gameLog.push(`${player.id} moved to ${BOARD[nearestDs].name}`);
            const dsProp = s.board[nearestDs];
            if (dsProp.ownerId && dsProp.ownerId !== player.id) {
              const dsOwner = s.players.find(p => p.id === dsProp.ownerId)!;
              const count = DATASTREAM_IDS.filter(id => s.board[id]?.ownerId === dsOwner.id).length;
              const rent = (DATASTREAM_RENT[count] || 0) * 2;
              const paid = Math.min(player.cred, rent);
              player.cred -= paid;
              dsOwner.cred += paid;
              s.gameLog.push(`${player.id} paid ¢${paid} double rent to ${dsOwner.id}`);
            }
          }
          break;
        }
        case "peek_deck":
          // Informational only — log what's on top
          s.gameLog.push(`${player.id} peeked at upcoming cards`);
          break;
        default:
          break;
      }
    }
  }

  private _advanceAuction(s: NeuroverseState): void {
    if (!s.auction) return;
    const alivePlayers = s.players.filter(p => p.cred > 0);

    // Auction ends ONLY when every alive player except the highest bidder has passed.
    // Bidding does NOT eliminate you — only passing does.
    const eligiblePlayers = s.players.filter(p => p.cred > 0 && !p.inFirewall); // Or just cred > 0
    const allOthersPassed = s.auction.highestBidder &&
      alivePlayers.filter(p => p.id !== s.auction!.highestBidder)
        .every(p => s.auction!.passed.includes(p.id));

    // Also end if everyone passed with no bids at all
    const everyonePassed = alivePlayers.every(p => s.auction!.passed.includes(p.id));

    // Or if only one person was alive to begin with and they bid or passed
    const onlyOneAlive = alivePlayers.length === 1 && (s.auction.passed.includes(alivePlayers[0].id) || s.auction.highestBidder === alivePlayers[0].id);

    if (allOthersPassed || everyonePassed || onlyOneAlive) {
      // Auction ends
      if (s.auction.highestBidder) {
        const winner = s.players.find(p => p.id === s.auction!.highestBidder)!;
        winner.cred -= s.auction.highestBid;
        s.board[s.auction.propertyId].ownerId = winner.id;
        s.gameLog.push(`${winner.id} won auction for ${BOARD[s.auction.propertyId].name} at ¢${s.auction.highestBid}`);
      } else {
        s.gameLog.push(`Auction ended with no bids`);
      }
      s.auction = null;
      s.turnPhase = "build";
    }
  }

  private _handleBankruptcy(s: NeuroverseState, player: NeuroversePlayer, _creditor: NeuroversePlayer): void {
    if (!player.hasRebooted) {
      // Reboot
      player.hasRebooted = true;
      player.rebootShield = true;
      // Auction off all properties
      for (let i = 0; i < s.board.length; i++) {
        if (s.board[i].ownerId === player.id) {
          s.board[i].ownerId = null;
          s.board[i].nodes = 0;
          s.board[i].hasTower = false;
          s.board[i].hasMegaframe = false;
        }
      }
      player.cred = 250;
      player.voltage = Math.min(MAX_VOLTAGE, 2);
      player.heldCards = [];
      s.gameLog.push(`${player.id} REBOOTED! ¢250 + shield`);
    } else {
      // Eliminated
      player.cred = 0;
      for (let i = 0; i < s.board.length; i++) {
        if (s.board[i].ownerId === player.id) {
          s.board[i].ownerId = null;
          s.board[i].nodes = 0;
          s.board[i].hasTower = false;
          s.board[i].hasMegaframe = false;
        }
      }
      s.gameLog.push(`${player.id} ELIMINATED`);
    }
  }

  private _triggerBlackout(s: NeuroverseState): void {
    s.gameLog.push("⚡ BLACKOUT EVENT ⚡");
    const netWorths = s.players.map(p => ({ id: p.id, nw: getNetWorth(p, s.board) }));
    netWorths.sort((a, b) => b.nw - a.nw);
    const leader = s.players.find(p => p.id === netWorths[0].id)!;
    const trailer = s.players.find(p => p.id === netWorths[netWorths.length - 1].id)!;

    // Leader penalty
    leader.cred -= Math.min(leader.cred, 150);
    s.gameLog.push(`${leader.id} (leader) -¢150`);

    // Trailer bonus
    trailer.cred += 100;
    trailer.voltage = Math.min(MAX_VOLTAGE, trailer.voltage + 2);
    s.gameLog.push(`${trailer.id} (trailer) +¢100 +2V`);

    // Grid reset: unmortgage all
    for (const prop of s.board) {
      if (prop.mortgaged) {
        prop.mortgaged = false;
      }
    }
  }

  checkResult(state: NeuroverseState): GameResult | null {
    // Check timeout
    if (state.round > state.maxRounds) {
      const scores = state.players.map(p => ({ id: p.id, score: calcGridScore(p, state.board) }));
      scores.sort((a, b) => b.score - a.score);
      return {
        outcome: "win",
        winnerId: scores[0].id,
        reason: `Countdown ended. ${scores[0].id} wins with Grid Score ${scores[0].score}`,
      };
    }

    // Check Dominance
    for (const player of state.players) {
      if (player.cred <= 0 && player.hasRebooted) continue;
      const threshold = DOMINANCE_THRESHOLD[state.playerCount] || 800;
      if (totalPropertyValue(state.board, player.id) >= threshold && hasMegaframe(state.board, player.id)) {
        return { outcome: "win", winnerId: player.id, reason: `DOMINANCE: ${player.id} controls ¢${totalPropertyValue(state.board, player.id)}+ with Megaframe` };
      }
    }

    // Check Control
    for (const player of state.players) {
      if (countCompletedColorGroups(state.board, player.id) >= 2) {
        return { outcome: "win", winnerId: player.id, reason: `CONTROL: ${player.id} owns 2+ complete color groups` };
      }
    }

    // Check if all but one eliminated
    const alive = state.players.filter(p => p.cred > 0 || !p.hasRebooted);
    if (alive.length <= 1 && state.players.length > 1) {
      return { outcome: "win", winnerId: alive[0]?.id || null, reason: "Last player standing" };
    }

    return null;
  }

  filterStateForPlayer(state: NeuroverseState, _playerId: PlayerId): NeuroverseState {
    return state; // Full visibility in Neuroverse
  }

  getRenderingHint(): string {
    return "neuroverse-board";
  }
}
