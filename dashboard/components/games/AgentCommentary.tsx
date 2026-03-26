"use client";

// ============================================================
// components/games/AgentCommentary.tsx
// Floating chat bubble showing the agent's reaction/commentary.
// Positioned absolutely below the agent header — no layout shift.
// Auto-dismisses after 5 seconds.
// ============================================================

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAgentProfile } from "@/lib/agentRoster";

interface AgentCommentaryProps {
  agentId: string;
  agentName: string;
  commentary: string | null;
  show: boolean;
  onDismiss: () => void;
}

export function AgentCommentary({
  agentId,
  agentName,
  commentary,
  show,
  onDismiss,
}: AgentCommentaryProps) {
  const profile = getAgentProfile(agentId);
  const accentColor = profile?.colorHex ?? "#22d3ee";

  useEffect(() => {
    if (show && commentary) {
      const timer = setTimeout(onDismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, commentary, onDismiss]);

  return (
    <AnimatePresence>
      {show && commentary && (
        <motion.div
          className="absolute top-full mt-2 z-30"
          style={{ left: "calc(50% + 70px)" }}
          initial={{ opacity: 0, y: -8, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
        >
          {/* Upward-pointing arrow — positioned on the left side of the bubble to point at the agent name */}
          <div
            className="absolute left-6 -top-[6px] w-0 h-0"
            style={{
              borderLeft: "7px solid transparent",
              borderRight: "7px solid transparent",
              borderBottom: `7px solid ${accentColor}40`,
            }}
          />
          {/* Bubble */}
          <div
            className="px-4 py-2.5 border text-sm font-medium text-[#ddd] leading-relaxed max-w-[280px] whitespace-normal"
            style={{
              borderColor: `${accentColor}40`,
              background: `${accentColor}10`,
              backdropFilter: "blur(12px)",
            }}
          >
            {commentary}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
