"use client";

// ============================================================
// components/games/AgentSelectScreen.tsx
// Screen to choose which agent to play against.
// Uses the existing agent roster from the dashboard.
// ============================================================

import { motion } from "framer-motion";
import { Bot, ArrowLeft, Swords } from "lucide-react";
import { AGENT_ROSTER, AgentProfile } from "@/lib/agentRoster";

interface AgentSelectScreenProps {
  onSelect: (agentId: string, agentName: string) => void;
  onBack: () => void;
}

export function AgentSelectScreen({ onSelect, onBack }: AgentSelectScreenProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-widest
            bg-transparent border border-[#333] text-[#888] hover:text-white hover:border-[#555]
            transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white">
            Select <span className="text-[#f97316]">Opponent</span>
          </h2>
          <p className="text-sm text-[#666] font-medium mt-0.5">
            Choose an agent to challenge in Tic-Tac-Toe
          </p>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
        {AGENT_ROSTER.map((agent, idx) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            index={idx}
            onSelect={() => onSelect(agent.id, agent.name)}
          />
        ))}
      </div>
    </div>
  );
}

function AgentCard({
  agent,
  index,
  onSelect,
}: {
  agent: AgentProfile;
  index: number;
  onSelect: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onSelect}
      className="group relative flex flex-col p-5 bg-[#111] border border-[#222]
        hover:border-[#f97316] transition-all text-left overflow-hidden"
    >
      {/* Background accent */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-bl-[60px] -translate-y-6 translate-x-6
          opacity-5 group-hover:opacity-15 transition-opacity"
        style={{ backgroundColor: agent.colorHex }}
      />

      <div className="relative z-10 flex flex-col h-full">
        {/* Avatar + Name */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 flex items-center justify-center border-2 text-sm font-black"
            style={{ borderColor: agent.colorHex, color: agent.colorHex }}
          >
            {agent.avatarFallback}
          </div>
          <div>
            <h3 className="font-black text-lg text-white uppercase tracking-tight">
              {agent.name}
            </h3>
            <p className="text-xs text-[#666] font-mono uppercase tracking-widest">
              {agent.role}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-[#777] font-medium leading-relaxed mb-4 flex-1">
          {agent.description}
        </p>

        {/* CTA */}
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest
          text-[#555] group-hover:text-[#f97316] transition-colors">
          <Swords className="w-3.5 h-3.5" />
          Challenge
        </div>
      </div>
    </motion.button>
  );
}
