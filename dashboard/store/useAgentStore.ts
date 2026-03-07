import { create } from 'zustand';
import type { ProviderStatus } from '@/lib/providers/types';

export type AgentStatus = 'ONLINE' | 'WORKING' | 'THINKING' | 'QUEUED' | 'OFFLINE' | 'IN_SUMMIT' | 'PAUSED';

export interface Agent {
    id: string;
    name: string;
    avatar: string;
    heroImage?: string;
    model: string;
    status: AgentStatus;
    currentTask: string | null;
    workspacePath: string;
    primaryProvider?: string;
    backupProvider?: string;
    providerStatus?: ProviderStatus;
}

interface AgentState {
    agents: Record<string, Agent>;
    upsertAgent: (agent: Agent) => void;
    updateStatus: (id: string, status: AgentStatus) => void;
    setAgentModel: (id: string, model: string) => void;
    setAgentHeroImage: (id: string, heroImage: string) => void;
    syncFromGateway: (gatewayAgents: any[]) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
    agents: {},
    upsertAgent: (agent) => set((state) => ({
        agents: { ...state.agents, [agent.id]: agent }
    })),
    updateStatus: (id, status) => set((state) => ({
        agents: {
            ...state.agents,
            [id]: { ...state.agents[id], status }
        }
    })),
    setAgentModel: (id, model) => set((state) => ({
        agents: {
            ...state.agents,
            [id]: { ...state.agents[id], model }
        }
    })),
    setAgentHeroImage: (id, heroImage) => set((state) => ({
        agents: {
            ...state.agents,
            [id]: { ...state.agents[id], heroImage }
        }
    })),
    syncFromGateway: (gatewayAgents) => set((state) => {
        const merged = { ...state.agents };
        for (const ga of gatewayAgents) {
            const id = ga.agentId || ga.id || ga.name;
            if (!id) continue;
            // Only create if doesn't exist locally — local config takes precedence
            if (!merged[id]) {
                merged[id] = {
                    id,
                    name: ga.name || (id.charAt(0).toUpperCase() + id.slice(1)),
                    avatar: ga.avatar || '',
                    model: ga.model || ga.defaultModel || 'unknown',
                    status: 'ONLINE' as AgentStatus,
                    currentTask: null,
                    workspacePath: ga.workspace || '',
                };
            } else {
                // Update status if agent exists locally
                merged[id] = { ...merged[id], status: 'ONLINE' as AgentStatus };
            }
        }
        return { agents: merged };
    }),
}));
