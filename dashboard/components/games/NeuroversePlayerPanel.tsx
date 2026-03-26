"use client";

// ============================================================
// components/games/NeuroversePlayerPanel.tsx
// Compact, game-style player cards. Shows rank, CRED, Voltage,
// property count, and active status with neon styling.
// ============================================================

import React from "react";
import { NeuroversePlayer, PropertyState } from "@/lib/games/adapters/neuroverse";
import { NETRUNNERS } from "@/lib/games/adapters/neuroverse-data";

const PLAYER_COLORS = ["#22c55e", "#06b6d4", "#f59e0b", "#ec4899"];
const PLAYER_GLOW = ["rgba(34,197,94,0.3)", "rgba(6,182,212,0.3)", "rgba(245,158,11,0.3)", "rgba(236,72,153,0.3)"];

interface PlayerPanelProps {
  players: NeuroversePlayer[];
  board: PropertyState[];
  activePlayerId: string;
  humanPlayerId: string;
  agentNames: Record<string, string>;
}

function getNetWorth(player: NeuroversePlayer, board: PropertyState[]): number {
  let total = player.cred;
  for (let i = 0; i < board.length; i++) {
    if (board[i]?.ownerId === player.id) total += 50;
  }
  return total;
}

function getPropCount(board: PropertyState[], playerId: string): number {
  return board.filter(p => p?.ownerId === playerId).length;
}

export function NeuroversePlayerPanel({
  players, board, activePlayerId, humanPlayerId, agentNames,
}: PlayerPanelProps) {
  // Sort by net worth descending for ranks
  const ranked = [...players].sort((a, b) => getNetWorth(b, board) - getNetWorth(a, board));
  const rankMap: Record<string, number> = {};
  ranked.forEach((p, i) => { rankMap[p.id] = i + 1; });
  const ordinals = ["1st", "2nd", "3rd", "4th"];
  const rankColors = ["#f59e0b", "#94a3b8", "#cd7f32", "#64748b"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
      {players.map((player) => {
        const idx = parseInt(player.id.split("-")[1]) - 1;
        const color = PLAYER_COLORS[idx] || "#94a3b8";
        const glow = PLAYER_GLOW[idx] || "rgba(148,163,184,0.2)";
        const isActive = player.id === activePlayerId;
        const isHuman = player.id === humanPlayerId;
        const name = agentNames[player.id] || player.id;
        const runner = NETRUNNERS.find(r => r.id === player.netrunner);
        const rank = rankMap[player.id];
        const propCount = getPropCount(board, player.id);
        const voltPct = Math.min(100, (player.voltage / 8) * 100);

        return (
          <div key={player.id} style={{
            padding: "8px 10px",
            background: isActive
              ? `linear-gradient(135deg, ${color}10, ${color}05)`
              : "rgba(15,23,42,0.6)",
            border: `1.5px solid ${isActive ? color : "rgba(148,163,184,0.08)"}`,
            borderRadius: "8px",
            transition: "all 0.3s ease",
            boxShadow: isActive ? `0 0 12px ${glow}` : "none",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Rank badge */}
            <div style={{
              position: "absolute", top: "4px", right: "6px",
              fontSize: "9px", fontWeight: 800,
              color: rankColors[rank - 1] || "#64748b",
              textTransform: "uppercase",
            }}>
              {ordinals[rank - 1]}
            </div>

            {/* Player identity row */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              {/* Token */}
              <div style={{
                width: "20px", height: "20px", borderRadius: "50%",
                background: color, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "8px", fontWeight: 800, color: "#000",
                boxShadow: isActive ? `0 0 8px ${glow}` : "none",
                flexShrink: 0,
              }}>
                {isHuman ? "👤" : name[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: "11px", fontWeight: 800, color: "#e2e8f0",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {isHuman ? "You" : name}
                </div>
                <div style={{
                  fontSize: "8px", fontWeight: 600, color,
                  textTransform: "uppercase", letterSpacing: "0.5px",
                }}>
                  {runner?.name || player.netrunner}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              fontSize: "10px", fontWeight: 700, fontFamily: "monospace",
            }}>
              {/* CRED */}
              <div style={{ color: "#f59e0b", display: "flex", alignItems: "center", gap: "2px" }}>
                <span style={{ fontSize: "8px" }}>¢</span>{player.cred}
              </div>
              {/* Properties */}
              <div style={{ color: "#94a3b8", display: "flex", alignItems: "center", gap: "2px" }}>
                <span style={{ fontSize: "8px" }}>🏠</span>{propCount}
              </div>
              {/* Status badges */}
              {player.inFirewall && (
                <span style={{
                  fontSize: "7px", padding: "1px 3px", borderRadius: "2px",
                  background: "rgba(239,68,68,0.15)", color: "#ef4444",
                  fontWeight: 800, letterSpacing: "0.5px",
                }}>🔒FW</span>
              )}
              {player.rebootShield && (
                <span style={{
                  fontSize: "7px", padding: "1px 3px", borderRadius: "2px",
                  background: "rgba(56,189,248,0.15)", color: "#38bdf8",
                  fontWeight: 800,
                }}>🛡️</span>
              )}
            </div>

            {/* Voltage bar */}
            <div style={{
              marginTop: "4px", height: "3px", borderRadius: "2px",
              background: "rgba(148,163,184,0.08)",
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: "2px",
                width: `${voltPct}%`,
                background: `linear-gradient(90deg, ${color}, ${color}80)`,
                boxShadow: `0 0 4px ${glow}`,
                transition: "width 0.5s ease",
              }} />
            </div>
            <div style={{
              fontSize: "7px", color: "#64748b", marginTop: "1px",
              display: "flex", justifyContent: "space-between",
            }}>
              <span>⚡ {player.voltage}V</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
