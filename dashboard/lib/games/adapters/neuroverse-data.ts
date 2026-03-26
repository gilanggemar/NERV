// ============================================================
// lib/games/adapters/neuroverse-data.ts
// Static game data: board spaces, cards, netrunners, rent tables.
// ============================================================

// --- Board Space Types ---
export type SpaceType = "district" | "datastream" | "server" | "glitch" | "signal" | "corner";
export type CornerKind = "boot_up" | "firewall" | "toll_zone" | "system_crash";
export type ColorGroup = "crimson" | "cyan" | "violet" | "gold" | "white" | "neon_pink";

export interface BoardSpace {
  id: number;
  name: string;
  type: SpaceType;
  color?: ColorGroup;
  price?: number;
  cornerKind?: CornerKind;
}

export const BOARD: BoardSpace[] = [
  { id: 0, name: "BOOT UP", type: "corner", cornerKind: "boot_up" },
  { id: 1, name: "Neon Alley", type: "district", color: "crimson", price: 60 },
  { id: 2, name: "Rust Row", type: "district", color: "crimson", price: 60 },
  { id: 3, name: "GLITCH", type: "glitch" },
  { id: 4, name: "Flicker Street", type: "district", color: "cyan", price: 100 },
  { id: 5, name: "Datastream Alpha", type: "datastream", price: 150 },
  { id: 6, name: "Server Node East", type: "server", price: 120 },
  { id: 7, name: "Pulse Avenue", type: "district", color: "cyan", price: 100 },
  { id: 8, name: "Voltage Lane", type: "district", color: "cyan", price: 120 },
  { id: 9, name: "SIGNAL", type: "signal" },
  { id: 10, name: "Chrome Boulevard", type: "district", color: "violet", price: 140 },
  { id: 11, name: "Datastream Beta", type: "datastream", price: 150 },
  { id: 12, name: "Cipher Row", type: "district", color: "violet", price: 140 },
  { id: 13, name: "Phantom Lane", type: "district", color: "violet", price: 160 },
  { id: 14, name: "FIREWALL", type: "corner", cornerKind: "firewall" },
  { id: 15, name: "Synth Market", type: "district", color: "gold", price: 180 },
  { id: 16, name: "SIGNAL", type: "signal" },
  { id: 17, name: "Overclock Drive", type: "district", color: "gold", price: 180 },
  { id: 18, name: "Hexcore Plaza", type: "district", color: "gold", price: 200 },
  { id: 19, name: "Datastream Gamma", type: "datastream", price: 150 },
  { id: 20, name: "Null Sector", type: "district", color: "white", price: 220 },
  { id: 21, name: "GLITCH", type: "glitch" },
  { id: 22, name: "Ghost Wire", type: "district", color: "white", price: 240 },
  { id: 23, name: "Datastream Delta", type: "datastream", price: 150 },
  { id: 24, name: "Server Node West", type: "server", price: 120 },
  { id: 25, name: "TOLL ZONE", type: "corner", cornerKind: "toll_zone" },
  { id: 26, name: "Darknet Row", type: "district", color: "neon_pink", price: 300 },
  { id: 27, name: "The Spire", type: "district", color: "neon_pink", price: 350 },
  // Space 28 is implicit: SYSTEM CRASH wraps to FIREWALL
];

export const SYSTEM_CRASH_POSITION = 28; // virtual space

// Color group → district IDs
export const COLOR_GROUPS: Record<ColorGroup, number[]> = {
  crimson: [1, 2],
  cyan: [4, 7, 8],
  violet: [10, 12, 13],
  gold: [15, 17, 18],
  white: [20, 22],
  neon_pink: [26, 27],
};

// Build costs per color group [node, tower, megaframe]
export const BUILD_COSTS: Record<ColorGroup, [number, number, number]> = {
  crimson: [25, 75, 150],
  cyan: [50, 100, 200],
  violet: [50, 100, 200],
  gold: [75, 125, 250],
  white: [100, 150, 300],
  neon_pink: [125, 175, 350],
};

// Rent table: [base, sectorLock, 1node, 2node, 3node, tower, megaframe]
export const RENT_TABLE: Record<number, number[]> = {
  1:  [4, 8, 20, 50, 100, 180, 400],
  2:  [4, 8, 20, 50, 100, 180, 400],
  4:  [8, 16, 35, 90, 180, 320, 550],
  7:  [8, 16, 35, 90, 180, 320, 550],
  8:  [10, 20, 40, 100, 200, 350, 600],
  10: [12, 24, 50, 130, 260, 450, 750],
  12: [12, 24, 50, 130, 260, 450, 750],
  13: [14, 28, 60, 150, 300, 500, 800],
  15: [16, 32, 70, 180, 360, 600, 950],
  17: [16, 32, 70, 180, 360, 600, 950],
  18: [18, 36, 80, 200, 400, 650, 1000],
  20: [20, 40, 90, 220, 450, 750, 1100],
  22: [22, 44, 100, 250, 500, 800, 1200],
  26: [30, 60, 150, 350, 650, 1000, 1500],
  27: [40, 80, 175, 400, 700, 1100, 1700],
};

// Mortgage value per district
export const MORTGAGE_VALUES: Record<number, number> = {
  1: 30, 2: 30, 4: 50, 7: 50, 8: 60,
  10: 70, 12: 70, 13: 80, 15: 90, 17: 90, 18: 100,
  20: 110, 22: 120, 26: 150, 27: 175,
  5: 75, 11: 75, 19: 75, 23: 75, // datastreams
  6: 60, 24: 60, // servers
};

// Datastream rent by count owned
export const DATASTREAM_RENT = [0, 30, 70, 150, 300];

// Datastream space IDs
export const DATASTREAM_IDS = [5, 11, 19, 23];
export const SERVER_IDS = [6, 24];

// --- Netrunner Characters ---
export type NetrunnerId = "ghost" | "cipher" | "nova" | "glitch_char" | "proxy" | "echo";

export interface Netrunner {
  id: NetrunnerId;
  name: string;
  passiveDesc: string;
  activeDesc: string;
}

export const NETRUNNERS: Netrunner[] = [
  { id: "ghost", name: "GHOST", passiveDesc: "Peek at top card when passing GLITCH/SIGNAL", activeDesc: "Vanish: Skip your move (once/game)" },
  { id: "cipher", name: "CIPHER", passiveDesc: "Collect ¢250 at BOOT UP", activeDesc: "Market Crash: All others pay ¢50 (once/game)" },
  { id: "nova", name: "NOVA", passiveDesc: "20% building discount", activeDesc: "Overclock: Place 1 free Node (once/game)" },
  { id: "glitch_char", name: "GLITCH", passiveDesc: "Opponents lose 1V when you pay rent", activeDesc: "System Wipe: Target discards held cards (once/game)" },
  { id: "proxy", name: "PROXY", passiveDesc: "Buy properties at 80% price", activeDesc: "Hostile Takeover: Force-buy unimproved property (once/game)" },
  { id: "echo", name: "ECHO", passiveDesc: "Swap GLITCH draw for SIGNAL", activeDesc: "Reverb: Copy another passive for 3 rounds (once/game)" },
];

// --- Card Effects ---
export interface GameCard {
  id: number;
  name: string;
  effect: string; // machine-readable effect code
  description: string; // human-readable
}

export const GLITCH_CARDS: GameCard[] = [
  { id: 1, name: "System Error", effect: "goto_firewall", description: "Go to FIREWALL" },
  { id: 2, name: "Data Leak", effect: "pay_bank:75", description: "Pay ¢75 to bank" },
  { id: 3, name: "Worm Virus", effect: "megaframe_tax:25", description: "Pay ¢25/Megaframe" },
  { id: 4, name: "Grid Surge", effect: "goto_nearest_datastream_double", description: "Move to nearest Datastream, double rent if owned" },
  { id: 5, name: "Power Outage", effect: "lose_voltage:2", description: "Lose 2 Voltage" },
  { id: 6, name: "Backdoor Found", effect: "move_back:3", description: "Move back 3 spaces" },
  { id: 7, name: "Corporate Raid", effect: "pay_each_player:25", description: "Pay each player ¢25" },
  { id: 8, name: "Infrastructure Tax", effect: "building_tax:20:40:80", description: "Pay ¢20/Node ¢40/Tower ¢80/Megaframe" },
  { id: 9, name: "Firewall Breach", effect: "escape_firewall_card", description: "Keep: Escape Firewall free" },
  { id: 10, name: "Packet Loss", effect: "half_next_rent", description: "Your next rent collection halved" },
  { id: 11, name: "Blackhat Alert", effect: "goto_space:27", description: "Go to The Spire" },
  { id: 12, name: "Signal Jam", effect: "no_voltage_next_turn", description: "Can't use Voltage next turn" },
  { id: 13, name: "Forced Reboot", effect: "goto_boot_up", description: "Return to BOOT UP, collect salary" },
  { id: 14, name: "Ransomware", effect: "ransomware", description: "Target pays you ¢50 or 2V" },
  { id: 15, name: "Memory Wipe", effect: "discard_escape_cards", description: "Discard Escape Firewall cards" },
  { id: 16, name: "DDoS Attack", effect: "remove_node_from_target", description: "Remove 1 Node from opponent" },
];

export const SIGNAL_CARDS: GameCard[] = [
  { id: 1, name: "Anonymous Donor", effect: "gain_cred:150", description: "Collect ¢150" },
  { id: 2, name: "Bug Bounty", effect: "gain_cred:100", description: "Collect ¢100" },
  { id: 3, name: "Crypto Windfall", effect: "gain_cred:75,gain_voltage:1", description: "¢75 + 1V" },
  { id: 4, name: "Street Cred", effect: "collect_from_each:25", description: "Collect ¢25 from each player" },
  { id: 5, name: "Firewall Key", effect: "escape_firewall_card", description: "Keep: Escape Firewall free" },
  { id: 6, name: "Grid Dividend", effect: "gain_per_property:10", description: "¢10 per property owned" },
  { id: 7, name: "Data Mining", effect: "gain_voltage:3", description: "Gain 3V" },
  { id: 8, name: "Neon Jackpot", effect: "gain_cred:200", description: "Collect ¢200" },
  { id: 9, name: "Free Upgrade", effect: "free_node", description: "Place 1 free Node" },
  { id: 10, name: "VPN Shield", effect: "rent_shield", description: "Keep: Skip 1 rent payment" },
  { id: 11, name: "Advance to BOOT UP", effect: "goto_boot_up", description: "Go to BOOT UP, collect salary" },
  { id: 12, name: "Insider Info", effect: "peek_deck:3", description: "Peek top 3 cards of any deck" },
  { id: 13, name: "Proxy Server", effect: "rent_boost:25", description: "+¢25 rent this round" },
  { id: 14, name: "Happy Client", effect: "gain_cred:50", description: "Collect ¢50" },
  { id: 15, name: "Tax Refund", effect: "gain_cred:100", description: "Collect ¢100" },
  { id: 16, name: "Supply Run", effect: "gain_voltage:2,gain_cred:25", description: "2V + ¢25" },
];

// Voltage ability costs
export const VOLTAGE_ABILITIES: Record<string, { cost: number; desc: string }> = {
  reroll: { cost: 1, desc: "Reroll both dice" },
  boost: { cost: 1, desc: "+/-1 to chosen die" },
  shields_up: { cost: 2, desc: "Halve rent owed" },
  hack: { cost: 3, desc: "Take over unimproved district you stand on" },
  surge: { cost: 2, desc: "Double rent on 1 property this round" },
  scramble: { cost: 1, desc: "Force opponent reroll" },
  emp_burst: { cost: 4, desc: "Downgrade 1 building on opponent property" },
};

// Blackout round triggers by player count
export const BLACKOUT_ROUNDS: Record<number, number[]> = {
  2: [6],
  3: [5, 9],
  4: [4, 8],
};

// Victory: Dominance threshold by player count
export const DOMINANCE_THRESHOLD: Record<number, number> = { 2: 700, 3: 800, 4: 800 };

export const MAX_ROUNDS = 12;
export const MAX_VOLTAGE = 8;
export const STARTING_CRED = 500;
export const STARTING_VOLTAGE = 2;
export const SALARY = 200;
export const FIREWALL_EXIT_FEE = 50;
export const TOLL_ZONE_FEE = 50;
export const MAX_NODES_PER_DISTRICT = 3;

// --- Player Pin Types ---
export type PinType = "drone" | "skull" | "bolt" | "shield" | "eye" | "chip" | "rocket" | "crystal";

export interface PinOption {
  id: PinType;
  name: string;
  symbol: string; // unicode for config display
}

export const PINS: PinOption[] = [
  { id: "drone", name: "DRONE", symbol: "⬡" },
  { id: "skull", name: "SKULL", symbol: "☠" },
  { id: "bolt", name: "BOLT", symbol: "⚡" },
  { id: "shield", name: "SHIELD", symbol: "◈" },
  { id: "eye", name: "EYE", symbol: "◉" },
  { id: "chip", name: "CHIP", symbol: "⬢" },
  { id: "rocket", name: "ROCKET", symbol: "▲" },
  { id: "crystal", name: "CRYSTAL", symbol: "◆" },
];
