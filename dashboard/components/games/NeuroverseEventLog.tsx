"use client";

// ============================================================
// components/games/NeuroverseEventLog.tsx
// Slim scrollable event timeline with color-coded icons.
// Designed to work in a collapsible side panel.
// ============================================================

import React, { useRef, useEffect } from "react";
import { GameEvent } from "@/stores/useNeuroverseStore";

const EVENT_ICONS: Record<string, string> = {
  move: "🎲", buy: "🏠", rent: "💰", card: "🃏",
  build: "🏗️", system: "⚡", victory: "🏆",
};

const EVENT_COLORS: Record<string, string> = {
  move: "#94a3b8", buy: "#22c55e", rent: "#f59e0b", card: "#8b5cf6",
  build: "#06b6d4", system: "#ef4444", victory: "#f59e0b",
};

export function NeuroverseEventLog({ events }: { events: GameEvent[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      gap: "2px",
      overflowY: "auto",
      flex: 1,
      scrollbarWidth: "thin",
      scrollbarColor: "rgba(148,163,184,0.15) transparent",
    }}>
      {events.map((event) => {
        const icon = EVENT_ICONS[event.type] || "📋";
        const color = EVENT_COLORS[event.type] || "#94a3b8";

        return (
          <div key={event.id} style={{
            display: "flex", alignItems: "flex-start", gap: "4px",
            padding: "3px 4px",
            borderRadius: "4px",
            fontSize: "9px",
            lineHeight: 1.3,
            transition: "background 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(148,163,184,0.04)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            <span style={{ fontSize: "8px", flexShrink: 0, marginTop: "1px" }}>{icon}</span>
            <span style={{ color, fontWeight: 600 }}>{event.text}</span>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
