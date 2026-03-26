"use client";

// ============================================================
// components/games/NeuroverseBoard.tsx
// ORTHOGRAPHIC 3D diamond board tray.
// Transform: rotateX(50deg) rotateZ(45deg) — no perspective.
// Real 3D side walls via preserve-3d + rotateX/Y(90deg).
// ============================================================

import React from "react";
import { NeuroverseState, NeuroversePlayer, PropertyState } from "@/lib/games/adapters/neuroverse";
import { BOARD, COLOR_GROUPS, ColorGroup, BoardSpace, PINS } from "@/lib/games/adapters/neuroverse-data";
import { useNeuroverseStore } from "@/stores/useNeuroverseStore";

const GROUP_COLORS: Record<ColorGroup, string> = {
  crimson: "#ef4444", gold: "#f59e0b", cyan: "#06b6d4",
  violet: "#8b5cf6", white: "#e2e8f0", neon_pink: "#ec4899",
};
function getGroupColor(id: number): string | null {
  for (const [c, ids] of Object.entries(COLOR_GROUPS))
    if (ids.includes(id)) return GROUP_COLORS[c as ColorGroup];
  return null;
}
const P_COL = ["#22c55e", "#06b6d4", "#f59e0b", "#ec4899"];

// ── Building ── (sized relative to tile: TW=72px)
// Megaframe: ~85% tile width, Tower: ~65%, Node: ~45%, Flag: ~25%
function Building3D({ prop }: { prop: PropertyState }) {
  if (!prop?.ownerId) return null;
  const c = P_COL[parseInt(prop.ownerId.split("-")[1]) - 1] || "#94a3b8";

  // ── MEGAFRAME: 60w × 56h (83% of 72px tile) ──
  if (prop.hasMegaframe) return (
    <div style={{ position: "relative", width: 60, height: 56, margin: "0 auto 2px" }}>
      <div style={{ position: "absolute", top: 6, left: 6, width: 60, height: 56, background: `${c}33`, borderRadius: 3 }} />
      <div style={{ position: "absolute", top: 0, left: 0, width: 56, height: 56, background: `linear-gradient(180deg,${c},${c}88)`, borderRadius: "4px 4px 0 0", boxShadow: `0 0 14px ${c}50` }}>
        {[0,1,2,3,4].map(i => <div key={i} style={{ width: 28, height: 4, margin: "5px auto 0", background: "rgba(255,255,255,.45)", borderRadius: 1 }} />)}
      </div>
      <div style={{ position: "absolute", top: -6, left: 0, width: 60, height: 10, background: `${c}cc`, borderRadius: 2, clipPath: "polygon(0 100%,12% 0,100% 0,88% 100%)" }} />
      <div style={{ position: "absolute", top: -16, left: 25, width: 5, height: 12, background: c }} />
      <div style={{ position: "absolute", top: -22, left: 22, width: 12, height: 12, borderRadius: "50%", background: c, boxShadow: `0 0 12px ${c}` }} />
    </div>
  );

  // ── TOWER: 48w × 42h (67% of 72px tile) ──
  if (prop.hasTower) return (
    <div style={{ position: "relative", width: 48, height: 42, margin: "0 auto 2px" }}>
      <div style={{ position: "absolute", top: 5, left: 5, width: 48, height: 42, background: `${c}33`, borderRadius: 3 }} />
      <div style={{ position: "absolute", top: 0, left: 0, width: 44, height: 42, background: `linear-gradient(180deg,${c}cc,${c}66)`, borderRadius: "3px 3px 0 0" }}>
        {[0,1,2,3].map(i => <div key={i} style={{ width: 22, height: 4, margin: "5px auto 0", background: "rgba(255,255,255,.4)", borderRadius: 1 }} />)}
      </div>
      <div style={{ position: "absolute", top: -6, left: 0, width: 50, height: 8, background: c, borderRadius: 2, clipPath: "polygon(0 100%,10% 0,100% 0,90% 100%)" }} />
    </div>
  );

  // ── NODES: 24w each × 20-32h (33% of tile each) ──
  if (prop.nodes > 0) return (
    <div style={{ display: "flex", gap: 4, justifyContent: "center", margin: "0 auto 2px" }}>
      {Array.from({ length: prop.nodes }).map((_, i) => {
        const h = 20 + i * 6;
        return <div key={i} style={{ position: "relative", width: 20, height: h }}>
          <div style={{ position: "absolute", top: 3, left: 3, width: 20, height: h, background: `${c}25`, borderRadius: 2 }} />
          <div style={{ position: "absolute", top: 0, left: 0, width: 18, height: h, background: `linear-gradient(180deg,${c}bb,${c}55)`, borderRadius: "3px 3px 0 0" }} />
        </div>;
      })}
    </div>
  );

  // ── OWNERSHIP FLAG: 52w × 64h — solid, tall, visible flag ──
  return (
    <div style={{ position: "relative", width: 52, height: 64, margin: "0 auto 2px" }}>
      {/* Ground shadow */}
      <div style={{ position: "absolute", bottom: -3, left: 4, width: 22, height: 12, borderRadius: "50%", background: "rgba(0,0,0,.8)", filter: "blur(4px)" }} />
      {/* Pole — solid metallic */}
      <div style={{
        position: "absolute", bottom: 2, left: 10, width: 6, height: 58,
        background: `linear-gradient(90deg, #888, #ddd, #aaa)`,
        borderRadius: 2,
        boxShadow: `1px 3px 6px rgba(0,0,0,0.7)`,
      }} />
      {/* Pennant — solid color, triangular flag shape */}
      <div style={{
        position: "absolute", top: 2, left: 16, width: 32, height: 28,
        background: c,
        clipPath: "polygon(0 0, 100% 0, 100% 40%, 0 100%)",
        boxShadow: `3px 3px 10px rgba(0,0,0,0.6)`,
      }} />
      {/* Pennant fold underside — darker shade for 3D depth */}
      <div style={{
        position: "absolute", top: 2, left: 16, width: 32, height: 28,
        background: "rgba(0,0,0,0.25)",
        clipPath: "polygon(0 70%, 100% 25%, 100% 40%, 0 100%)",
      }} />
      {/* Pennant highlight stripe */}
      <div style={{
        position: "absolute", top: 8, left: 21, width: 22, height: 3,
        background: "rgba(255,255,255,0.5)", borderRadius: 1,
      }} />
      <div style={{
        position: "absolute", top: 14, left: 21, width: 16, height: 2,
        background: "rgba(255,255,255,0.3)", borderRadius: 1,
      }} />
      {/* Pole tip ball — solid gold */}
      <div style={{
        position: "absolute", top: -5, left: 7, width: 13, height: 13,
        borderRadius: "50%",
        background: `radial-gradient(circle at 40% 35%, #fff, ${c})`,
        boxShadow: `0 0 12px ${c}, 0 2px 4px rgba(0,0,0,0.5)`,
      }} />
    </div>
  );
}

// ── Icon ──
function SpaceTypeIcon({ space, size: s }: { space: BoardSpace; size: number }) {
  if (space.type === "corner") {
    if (space.cornerKind === "boot_up") return <div style={{ width: s, height: s, borderRadius: "50%", border: "4px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(34,197,94,.3)" }}><div style={{ width: 0, height: 0, borderLeft: `${s/2.2}px solid #22c55e`, borderTop: `${s/3}px solid transparent`, borderBottom: `${s/3}px solid transparent`, marginLeft: s/10 }} /></div>;
    if (space.cornerKind === "firewall") return <div style={{ width: s, height: s, borderRadius: s*.15, background: "linear-gradient(135deg,#ef4444,#dc2626)", boxShadow: "0 0 16px rgba(239,68,68,.5)", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: s*.35, height: s*.55, borderRadius: 4, background: "#fff", opacity: .95 }} /></div>;
    if (space.cornerKind === "toll_zone") return <div style={{ width: s, height: s, background: "linear-gradient(135deg,#f59e0b,#d97706)", borderRadius: s*.15, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(245,158,11,.4)" }}><div style={{ fontSize: s*.6, fontWeight: 900, color: "#000" }}>$</div></div>;
    if (space.cornerKind === "system_crash") return <div style={{ width: s, height: s, background: "#ef4444", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 18px rgba(239,68,68,.5)" }}><div style={{ fontSize: s*.6, fontWeight: 900, color: "#fff" }}>!</div></div>;
  }
  if (space.type === "glitch") return <div style={{ width: s, height: s, position: "relative" }}><div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#f59e0b,#d97706)", clipPath: "polygon(50% 0%,0% 100%,100% 100%)", boxShadow: "0 0 12px rgba(245,158,11,.4)" }} /></div>;
  if (space.type === "signal") return <div style={{ width: s, height: s, borderRadius: "50%", border: "4px solid #8b5cf6", boxShadow: "0 0 14px rgba(139,92,246,.3)", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: s*.4, height: s*.4, borderRadius: "50%", background: "#8b5cf6" }} /></div>;
  if (space.type === "datastream") return <div style={{ display: "flex", gap: s*.08, alignItems: "flex-end" }}>{[.5,.75,1].map((h,i) => <div key={i} style={{ width: s*.28, height: s*h, background: "#06b6d4", borderRadius: 3, boxShadow: "0 0 8px rgba(6,182,212,.4)" }} />)}</div>;
  if (space.type === "server") return <div style={{ width: s, height: s*.85, borderRadius: 5, background: "linear-gradient(180deg,#475569,#334155)", border: "3px solid #64748b", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: s*.35, height: s*.35, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 12px #22c55e" }} /></div>;
  return null;
}

// ── Pin ── 3D billboard pin (counter-rotated to face camera)
function PlayerPin3D({ player, isMoving }: { player: NeuroversePlayer; isMoving?: boolean }) {
  const idx = parseInt(player.id.split("-")[1]) - 1;
  const c = P_COL[idx] || "#fff";
  const { pinAssignments } = useNeuroverseStore();
  const pinType = pinAssignments[player.id] || "drone";
  const pinData = PINS.find(p => p.id === pinType);
  const symbol = pinData?.symbol || "⬡";

  return (
    <div style={{
      position: "relative", width: 44, height: 58,
      filter: `drop-shadow(0 4px 10px ${c}90)`,
      animation: isMoving ? "nv-pinBounce 0.4s ease" : undefined,
    }}>
      {/* Shadow on ground */}
      <div style={{
        position: "absolute", bottom: -2, left: 8, width: 28, height: 12,
        borderRadius: "50%", background: "rgba(0,0,0,.8)", filter: "blur(5px)",
      }} />
      {/* Stem */}
      <div style={{
        position: "absolute", bottom: 8, left: 18, width: 8, height: 22,
        background: `linear-gradient(90deg, ${c}55, ${c}ee, ${c}55)`,
        borderRadius: 2,
        boxShadow: `inset 1px 0 3px rgba(255,255,255,0.4), inset -1px 0 2px rgba(0,0,0,0.3)`,
      }} />
      {/* Base */}
      <div style={{
        position: "absolute", bottom: 3, left: 7, width: 30, height: 12,
        borderRadius: "50%",
        background: `linear-gradient(180deg, ${c}, ${c}88)`,
        border: "1.5px solid rgba(255,255,255,0.4)",
        boxShadow: `0 3px 6px rgba(0,0,0,0.6), 0 0 14px ${c}50`,
      }} />
      {/* Head — bigger round with symbol */}
      <div style={{
        position: "absolute", top: 0, left: 2, width: 40, height: 40,
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 35%, ${c}, ${c}aa)`,
        border: "2.5px solid rgba(255,255,255,0.5)",
        boxShadow: `0 0 20px ${c}90, inset 0 -5px 10px rgba(0,0,0,0.3)`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          fontSize: 20, fontWeight: 900, color: "#000",
          textShadow: "0 0 4px rgba(255,255,255,0.6)",
          lineHeight: 1,
        }}>
          {symbol}
        </span>
      </div>
    </div>
  );
}

// ── Pins Overlay — renders all pins at tile centers, offset when stacked ──
function PinsOverlay({ players, tileCenters }: { players: NeuroversePlayer[]; tileCenters: { x: number; y: number }[] }) {
  const prevPositions = React.useRef<Record<string, number>>({});
  const [movingPins, setMovingPins] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    const newMoving = new Set<string>();
    players.forEach(p => {
      if (prevPositions.current[p.id] !== undefined && prevPositions.current[p.id] !== p.position) {
        newMoving.add(p.id);
      }
      prevPositions.current[p.id] = p.position;
    });
    if (newMoving.size > 0) {
      setMovingPins(newMoving);
      const t = setTimeout(() => setMovingPins(new Set()), 1400);
      return () => clearTimeout(t);
    }
  }, [players.map(p => p.position).join(",")]);

  // Group by position for stacking offsets
  const posGroups: Record<number, NeuroversePlayer[]> = {};
  players.forEach(p => {
    if (!posGroups[p.position]) posGroups[p.position] = [];
    posGroups[p.position].push(p);
  });

  return (
    <>
      {players.map(p => {
        const center = tileCenters[p.position];
        if (!center) return null;
        const group = posGroups[p.position] || [p];
        const idxInGroup = group.indexOf(p);
        const total = group.length;
        // Fan out horizontally: offset from center
        const spreadX = total > 1 ? (idxInGroup - (total - 1) / 2) * 22 : 0;
        const spreadY = total > 1 ? (idxInGroup - (total - 1) / 2) * -4 : 0;
        return (
          <div key={p.id} style={{
            position: "absolute",
            left: center.x - 18 + spreadX,
            top: center.y - 44 + spreadY,
            transition: "left 1.2s cubic-bezier(0.25,0.46,0.45,0.94), top 1.2s cubic-bezier(0.25,0.46,0.45,0.94)",
            zIndex: 20 + idxInGroup,
            transform: "translateZ(30px) rotateZ(-45deg) rotateX(-50deg)",
            transformStyle: "preserve-3d",
          }}>
            <PlayerPin3D player={p} isMoving={movingPins.has(p.id)} />
          </div>
        );
      })}
    </>
  );
}

// ── Tile ──
function SpaceTile({ space, spaceId, prop, players, isActive, style }: {
  space: BoardSpace; spaceId: number; prop: PropertyState;
  players: NeuroversePlayer[]; isActive: boolean; style: React.CSSProperties;
}) {
  const gc = getGroupColor(spaceId);
  const corner = space.type === "corner";
  const district = space.type === "district";

  // Adjust orientations so all text is readable from the screen's bottom perspective.
  let rotation = 0;
  if ([0, 14, 21].includes(spaceId)) {
    // 3 visual corners (BOOT UP, FIREWALL, GLITCH): face the camera straight up
    rotation = -45;
  } else if ((spaceId >= 1 && spaceId <= 6) || (spaceId >= 15 && spaceId <= 20)) {
    // Horizontal edges visually: Top-Right row (1..6), and Bottom-Left row (15..20)
    rotation = 0;
  } else {
    // Vertical edges visually: Bottom-Right row (7..13), and Top-Left row (22..27)
    rotation = -90;
  }

  // Crisp rendering under isometric transforms
  const crispText: React.CSSProperties = {
    willChange: "transform",
    backfaceVisibility: "hidden",
    WebkitFontSmoothing: "antialiased" as any,
  };

  return (
    <div style={{ position: "absolute", ...style, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: "translateZ(2px)" }}>
      {/* Structural base of the tile */}
      <div style={{ position: "absolute", top: 4, left: 4, width: "100%", height: "100%", background: gc ? `${gc}15` : "rgba(10,15,30,.7)", borderRadius: 6 }} />
      
      <div style={{
        position: "relative", width: "100%", height: "100%",
        background: isActive ? "linear-gradient(135deg,rgba(255,255,255,.14),rgba(255,255,255,.05))" : "linear-gradient(135deg,rgba(18,26,46,.95),rgba(25,34,54,.90))",
        border: `2px solid ${isActive && gc ? gc : gc ? `${gc}44` : "rgba(148,163,184,.15)"}`,
        borderRadius: 6, overflow: "hidden",
        boxShadow: isActive ? `0 0 20px ${gc || "rgba(6,182,212,.4)"}` : "0 4px 10px rgba(0,0,0,.6)", zIndex: 1,
      }}>
        
        {/* Oriented Layout Container */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          transform: `rotate(${rotation}deg)`,
          padding: gc ? "12px 4px 4px" : "4px",
          gap: 1,
          ...crispText,
        }}>
          {/* Inner Color Header */}
          {gc && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: `linear-gradient(180deg,${gc},${gc}bb)`, flexShrink: 0 }} />}
          
          {/* Icon — compact sizing */}
          {!district && (
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <SpaceTypeIcon space={space} size={corner ? 36 : 26} />
            </div>
          )}

          {/* Name */}
          <div style={{ 
            fontSize: corner ? 16 : 14, 
            fontWeight: 900, 
            color: gc ? "#fff" : "#cbd5e1", 
            textTransform: "uppercase", 
            letterSpacing: 0.3, 
            textAlign: "center", 
            lineHeight: 1.05,
            textShadow: "0 1px 3px rgba(0,0,0,0.95)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            maxWidth: "100%",
            overflow: "hidden",
            ...crispText,
          }}>
            {space.name}
          </div>

          {/* Price — crisp & readable */}
          {space.price && !prop?.ownerId && (
            <div style={{ 
              fontSize: 15, 
              color: "#e2e8f0", 
              fontFamily: "monospace", 
              fontWeight: 800,
              background: "rgba(0,0,0,0.65)",
              padding: "1px 6px",
              borderRadius: 3,
              textShadow: "0 1px 2px rgba(0,0,0,1)",
              flexShrink: 0,
              ...crispText,
            }}>
              ¢{space.price}
            </div>
          )}
        </div>

        {/* Unrotated 3D Elements (billboard toward camera) */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          pointerEvents: "none", zIndex: 10,
          transform: "translateZ(20px) rotateZ(-45deg) rotateX(-50deg)",
          transformStyle: "preserve-3d",
        }}>
          <Building3D prop={prop} />
        </div>
      </div>
    </div>
  );
}


// ======================== MAIN BOARD ========================
interface NeuoverseBoardProps { state: NeuroverseState; humanPlayerId: string; }

export function NeuroverseBoard({ state, humanPlayerId }: NeuoverseBoardProps) {
  const activePlayerId = state.turnOrder[state.activePlayerIndex];
  const activePos = state.players.find(p => p.id === activePlayerId)?.position ?? -1;

  const TW_orig = 72, CS_orig = 100, GAP_orig = 3;
  const FP = 80;   // frame padding — THICK border around tiles
  const SD = 60;   // side depth — how tall the tray walls are
  const ET = 6;
  const BS = CS_orig * 2 + ET * (TW_orig + GAP_orig) - GAP_orig; // ~647
  const FS = BS + FP * 2; // total frame size ~807

  // ── UNIFIED PERIMETER LAYOUT ──
  // Tiles are dynamically resized to perfectly close gaps while maintaining
  // exactly one consistent outer margin for all 4 edges.
  const OM = 8;                        // Constant outer margin
  const RO = -FP + OM;                 // Ring origin (top-left)
  const RS = BS + 2 * FP - 2 * OM;    // Ring outer size

  const GAP = 4;                       // New tight gap between tiles
  const sizes = new Array(28).fill(0);
  const baseRatio = (id: number) => BOARD[id]?.type === "corner" ? 1.35 : 1.0;

  // 1. TOP ROW (IDs 0..7)
  const topBase = [0,1,2,3,4,5,6,7].reduce((s, id) => s + baseRatio(id), 0);
  const topAvail = RS - 7 * GAP;
  for (let id = 0; id <= 7; id++) sizes[id] = topAvail * (baseRatio(id) / topBase);

  // 2. BOTTOM ROW (IDs 14..21)
  const botBase = [14,15,16,17,18,19,20,21].reduce((s, id) => s + baseRatio(id), 0);
  const botAvail = RS - 7 * GAP;
  for (let id = 14; id <= 21; id++) sizes[id] = botAvail * (baseRatio(id) / botBase);

  // 3. RIGHT COL (IDs 8..13)
  const rightAvail = RS - sizes[7] - GAP - sizes[14] - GAP;
  const rightBase = [8,9,10,11,12,13].reduce((s, id) => s + baseRatio(id), 0);
  const rightTileAvail = rightAvail - 5 * GAP;
  for (let id = 8; id <= 13; id++) sizes[id] = rightTileAvail * (baseRatio(id) / rightBase);

  // 4. LEFT COL (IDs 22..27)
  const leftAvail = RS - sizes[21] - GAP - sizes[0] - GAP;
  const leftBase = [22,23,24,25,26,27].reduce((s, id) => s + baseRatio(id), 0);
  const leftTileAvail = leftAvail - 5 * GAP;
  for (let id = 22; id <= 27; id++) sizes[id] = leftTileAvail * (baseRatio(id) / leftBase);

  function pos(id: number): React.CSSProperties {
    const w = sizes[id], h = sizes[id];
    let x = 0, y = 0;

    if (id >= 0 && id <= 7) {
      y = RO;
      let accX = 0;
      for (let i = 0; i < id; i++) accX += sizes[i] + GAP;
      x = RO + accX;
    } else if (id >= 8 && id <= 13) {
      x = RO + RS - w;
      let accY = sizes[7] + GAP;
      for (let i = 8; i < id; i++) accY += sizes[i] + GAP;
      y = RO + accY;
    } else if (id >= 14 && id <= 21) {
      y = RO + RS - h;
      let accX = 0;
      for (let i = 14; i < id; i++) accX += sizes[i] + GAP;
      x = RO + RS - accX - w;
    } else if (id >= 22 && id <= 27) {
      x = RO;
      let accY = sizes[21] + GAP;
      for (let i = 22; i < id; i++) accY += sizes[i] + GAP;
      y = RO + RS - accY - h;
    }

    return { left: x, top: y, width: w, height: h };
  }

  // Wall style helper
  const wallBase = { position: "absolute" as const, backfaceVisibility: "hidden" as const };

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", transformStyle: "preserve-3d" }}>
      <div style={{
        position: "relative", width: BS, height: BS,
        transform: "rotateX(50deg) rotateZ(45deg) scale(0.90)",
        transformOrigin: "center center",
        transformStyle: "preserve-3d",
      }}>
        {/* ═══ GROUND SHADOW ═══ */}
        <div style={{ position: "absolute", inset: -FP - 30, borderRadius: 24, transform: `translateZ(${-SD - 10}px)`, background: "rgba(0,0,0,.15)", boxShadow: "0 0 80px 40px rgba(0,0,0,.5)" }} />

        {/* ═══ BOTTOM FACE ═══ */}
        <div style={{ position: "absolute", inset: -FP, borderRadius: 14, background: "#04030a", transform: `translateZ(${-SD}px)` }} />

        {/* ═══ SIDE WALLS — real 3D panels ═══ */}
        {/* Bottom wall (becomes diamond's lower-right edge after rotateZ) */}
        <div style={{ ...wallBase, left: -FP, top: BS + FP, width: FS, height: SD, transformOrigin: "top", transform: "rotateX(-90deg)", background: "linear-gradient(180deg, #1e1830 0%, #0c0a18 100%)", borderRadius: "0 0 14px 14px" }} />
        {/* Right wall (becomes diamond's lower-left edge after rotateZ) */}
        <div style={{ ...wallBase, left: BS + FP, top: -FP, width: SD, height: FS, transformOrigin: "left", transform: "rotateY(90deg)", background: "linear-gradient(180deg, #1a1428 0%, #0a0814 100%)", borderRadius: "0 14px 14px 0" }} />
        {/* Top wall (upper-left diamond edge — mostly hidden) */}
        <div style={{ ...wallBase, left: -FP, top: -FP - SD, width: FS, height: SD, transformOrigin: "bottom", transform: "rotateX(90deg)", background: "#08060e" }} />
        {/* Left wall (upper-right diamond edge — mostly hidden) */}
        <div style={{ ...wallBase, left: -FP - SD, top: -FP, width: SD, height: FS, transformOrigin: "right", transform: "rotateY(-90deg)", background: "#0a0812" }} />

        {/* ═══ TOP SURFACE — thick tray frame ═══ */}
        <div style={{
          position: "absolute", inset: -FP, borderRadius: 14,
          background: "linear-gradient(135deg, rgba(42,34,60,.97), rgba(24,18,38,.98) 40%, rgba(16,12,28,.99))",
          border: "3px solid rgba(180,160,140,.10)",
          transform: "translateZ(0.5px)",
          boxShadow: "inset 0 3px 16px rgba(255,255,255,.04), inset 0 -4px 16px rgba(0,0,0,.6)",
        }}>
          <div style={{ position: "absolute", inset: 4, borderRadius: 11, border: "1.5px solid rgba(200,180,160,.05)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 0, left: 0, right: "50%", bottom: "50%", borderRadius: "14px 0 0 0", background: "linear-gradient(135deg, rgba(255,255,255,.03), transparent 60%)", pointerEvents: "none" }} />
        </div>

        {/* ═══ CENTER RECESS ═══ */}
        <div style={{
          position: "absolute", top: CS_orig - 6, left: CS_orig - 6, right: CS_orig - 6, bottom: CS_orig - 6,
          background: "radial-gradient(circle at 50% 45%, rgba(6,182,212,.04), transparent 60%), linear-gradient(180deg, rgba(4,6,14,.98), rgba(8,12,24,.95))",
          borderRadius: 8, border: "2.5px solid rgba(60,45,80,.12)",
          transform: "translateZ(-4px)",
          boxShadow: "inset 0 8px 32px rgba(0,0,0,.7), inset 0 3px 8px rgba(0,0,0,.5), inset 0 -3px 12px rgba(0,0,0,.4)",
        }}>
          <div style={{ width: "100%", height: "100%", backgroundImage: "linear-gradient(rgba(148,163,184,.02) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.02) 1px, transparent 1px)", backgroundSize: "24px 24px", borderRadius: 8 }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%) rotate(-45deg)", fontSize: 16, fontWeight: 900, letterSpacing: 8, color: "rgba(148,163,184,.05)", textTransform: "uppercase", whiteSpace: "nowrap", pointerEvents: "none", userSelect: "none" }}>NEUROVERSE</div>
          </div>
        </div>

        {/* ═══ TILES ═══ */}
        {Array.from({ length: 28 }, (_, id) => id < BOARD.length ? (
          <SpaceTile key={id} space={BOARD[id]} spaceId={id} prop={state.board[id]} players={state.players} isActive={activePos === id} style={pos(id)} />
        ) : null)}

        {/* ═══ PIN OVERLAY — persistent layer with CSS transitions ═══ */}
        <PinsOverlay
          players={state.players}
          tileCenters={Array.from({ length: 28 }, (_, id) => {
            const p = pos(id);
            return { x: (p.left as number) + (p.width as number) / 2, y: (p.top as number) + (p.height as number) / 2 };
          })}
        />
      </div>
    </div>
  );
}
