import { create } from 'zustand';

export interface CapabilityMcp {
    id: string;
    name: string;
    description: string | null;
    server_url: string;
    transport: string;
    status: string;
    auth_type: string;
    tools: Array<{ name: string; description: string }>;
    icon: string | null;
    category: string;
    config_json: Record<string, any>;
    last_health_check: string | null;
    last_health_status: string | null;
    created_at: string;
    updated_at: string;
}

export interface CapabilitySkill {
    id: string;
    name: string;
    description: string | null;
    content: string;
    version: string;
    status: string;
    category: string;
    icon: string | null;
    tags: string[];
    config_json: Record<string, any>;
    author: string;
    created_at: string;
    updated_at: string;
}

export interface AgentCapabilityAssignment {
    id: string;
    agent_id: string;
    capability_type: 'mcp' | 'skill';
    capability_id: string;
    is_enabled: boolean;
    config_overrides: Record<string, any>;
    assigned_at: string;
}

interface CapabilitiesState {
    // Data
    mcps: CapabilityMcp[];
    skills: CapabilitySkill[];
    assignments: AgentCapabilityAssignment[];

    // Loading states
    isLoading: boolean;
    isSeeding: boolean;

    // Actions — MCPs
    fetchMcps: () => Promise<void>;
    createMcp: (data: Partial<CapabilityMcp>) => Promise<void>;
    updateMcp: (id: string, data: Partial<CapabilityMcp>) => Promise<void>;
    deleteMcp: (id: string) => Promise<void>;
    healthCheckMcp: (id: string) => Promise<void>;

    // Actions — Skills
    fetchSkills: () => Promise<void>;
    createSkill: (data: Partial<CapabilitySkill>) => Promise<void>;
    updateSkill: (id: string, data: Partial<CapabilitySkill>) => Promise<void>;
    deleteSkill: (id: string) => Promise<void>;

    // Actions — Assignments
    fetchAssignmentsForAgent: (agentId: string) => Promise<void>;
    assignCapability: (agentId: string, capabilityType: 'mcp' | 'skill', capabilityId: string) => Promise<void>;
    unassignCapability: (assignmentId: string) => Promise<void>;
    bulkAssign: (agentIds: string[], capabilityType: 'mcp' | 'skill', capabilityId: string) => Promise<void>;
    bulkUnassign: (agentIds: string[], capabilityType: 'mcp' | 'skill', capabilityId: string) => Promise<void>;

    // Actions — Seed
    seedDefaults: () => Promise<void>;

    // Computed helpers
    getMcpCountForAgent: (agentId: string) => number;
    getSkillCountForAgent: (agentId: string) => number;
    getToolCountForAgent: (agentId: string) => number;
    getAssignedMcpsForAgent: (agentId: string) => CapabilityMcp[];
    getAssignedSkillsForAgent: (agentId: string) => CapabilitySkill[];
}

export const useCapabilitiesStore = create<CapabilitiesState>((set, get) => ({
    // Data
    mcps: [],
    skills: [],
    assignments: [],

    // Loading states
    isLoading: false,
    isSeeding: false,

    // === MCPs ===

    fetchMcps: async () => {
        set({ isLoading: true });
        try {
            const res = await fetch('/api/capabilities/mcps');
            if (res.ok) {
                const json = await res.json();
                set({ mcps: Array.isArray(json?.data) ? json.data : [] });
            }
        } catch (e) {
            console.error('Failed to fetch MCPs:', e);
        } finally {
            set({ isLoading: false });
        }
    },

    createMcp: async (data) => {
        try {
            const res = await fetch('/api/capabilities/mcps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                get().fetchMcps();
            }
        } catch (e) {
            console.error('Failed to create MCP:', e);
        }
    },

    updateMcp: async (id, data) => {
        try {
            const res = await fetch(`/api/capabilities/mcps/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                get().fetchMcps();
            }
        } catch (e) {
            console.error('Failed to update MCP:', e);
        }
    },

    deleteMcp: async (id) => {
        try {
            const res = await fetch(`/api/capabilities/mcps/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                get().fetchMcps();
            }
        } catch (e) {
            console.error('Failed to delete MCP:', e);
        }
    },

    healthCheckMcp: async (id) => {
        try {
            const res = await fetch(`/api/capabilities/mcps/${id}/health`, {
                method: 'POST',
            });
            if (res.ok) {
                get().fetchMcps();
            }
        } catch (e) {
            console.error('Failed to health check MCP:', e);
        }
    },

    // === Skills ===

    fetchSkills: async () => {
        set({ isLoading: true });
        try {
            const res = await fetch('/api/capabilities/skills');
            if (res.ok) {
                const json = await res.json();
                set({ skills: Array.isArray(json?.data) ? json.data : [] });
            }
        } catch (e) {
            console.error('Failed to fetch skills:', e);
        } finally {
            set({ isLoading: false });
        }
    },

    createSkill: async (data) => {
        try {
            const res = await fetch('/api/capabilities/skills', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                get().fetchSkills();
            }
        } catch (e) {
            console.error('Failed to create skill:', e);
        }
    },

    updateSkill: async (id, data) => {
        try {
            const res = await fetch(`/api/capabilities/skills/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                get().fetchSkills();
            }
        } catch (e) {
            console.error('Failed to update skill:', e);
        }
    },

    deleteSkill: async (id) => {
        try {
            const res = await fetch(`/api/capabilities/skills/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                get().fetchSkills();
            }
        } catch (e) {
            console.error('Failed to delete skill:', e);
        }
    },

    // === Assignments ===

    fetchAssignmentsForAgent: async (agentId) => {
        try {
            const res = await fetch(`/api/capabilities/assignments?agent_id=${agentId}`);
            if (res.ok) {
                const json = await res.json();
                const newAssignments = Array.isArray(json?.data) ? json.data : [];
                // Merge with existing assignments (replace for this agent)
                set((state) => ({
                    assignments: [
                        ...state.assignments.filter((a) => a.agent_id !== agentId),
                        ...newAssignments,
                    ],
                }));
            }
        } catch (e) {
            console.error('Failed to fetch assignments:', e);
        }
    },

    assignCapability: async (agentId, capabilityType, capabilityId) => {
        try {
            const res = await fetch('/api/capabilities/assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agent_id: agentId,
                    capability_type: capabilityType,
                    capability_id: capabilityId,
                }),
            });
            if (res.ok) {
                get().fetchAssignmentsForAgent(agentId);
            }
        } catch (e) {
            console.error('Failed to assign capability:', e);
        }
    },

    unassignCapability: async (assignmentId) => {
        const assignment = get().assignments.find((a) => a.id === assignmentId);
        try {
            const res = await fetch(`/api/capabilities/assignments?id=${assignmentId}`, {
                method: 'DELETE',
            });
            if (res.ok && assignment) {
                get().fetchAssignmentsForAgent(assignment.agent_id);
            }
        } catch (e) {
            console.error('Failed to unassign capability:', e);
        }
    },

    bulkAssign: async (agentIds, capabilityType, capabilityId) => {
        try {
            const res = await fetch('/api/capabilities/assignments/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agent_ids: agentIds,
                    capability_type: capabilityType,
                    capability_id: capabilityId,
                }),
            });
            if (res.ok) {
                // Refresh assignments for all affected agents
                for (const agentId of agentIds) {
                    get().fetchAssignmentsForAgent(agentId);
                }
            }
        } catch (e) {
            console.error('Failed to bulk assign:', e);
        }
    },

    bulkUnassign: async (agentIds, capabilityType, capabilityId) => {
        try {
            const res = await fetch('/api/capabilities/assignments/bulk', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agent_ids: agentIds,
                    capability_type: capabilityType,
                    capability_id: capabilityId,
                }),
            });
            if (res.ok) {
                // Refresh assignments for all affected agents
                for (const agentId of agentIds) {
                    get().fetchAssignmentsForAgent(agentId);
                }
            }
        } catch (e) {
            console.error('Failed to bulk unassign:', e);
        }
    },

    // === Seed ===

    seedDefaults: async () => {
        set({ isSeeding: true });
        try {
            const res = await fetch('/api/capabilities/seed', { method: 'POST' });
            if (res.ok) {
                await get().fetchMcps();
                await get().fetchSkills();
            }
        } catch (e) {
            console.error('Failed to seed defaults:', e);
        } finally {
            set({ isSeeding: false });
        }
    },

    // === Computed helpers ===

    getMcpCountForAgent: (agentId) => {
        const { assignments } = get();
        return assignments.filter(
            (a) => a.agent_id === agentId && a.capability_type === 'mcp' && a.is_enabled
        ).length;
    },

    getSkillCountForAgent: (agentId) => {
        const { assignments } = get();
        return assignments.filter(
            (a) => a.agent_id === agentId && a.capability_type === 'skill' && a.is_enabled
        ).length;
    },

    getToolCountForAgent: (agentId) => {
        const { assignments, mcps } = get();
        const mcpAssignments = assignments.filter(
            (a) => a.agent_id === agentId && a.capability_type === 'mcp' && a.is_enabled
        );
        let totalTools = 0;
        for (const assignment of mcpAssignments) {
            const mcp = mcps.find((m) => m.id === assignment.capability_id);
            if (mcp && Array.isArray(mcp.tools)) {
                totalTools += mcp.tools.length;
            }
        }
        return totalTools;
    },

    getAssignedMcpsForAgent: (agentId) => {
        const { assignments, mcps } = get();
        const mcpAssignments = assignments.filter(
            (a) => a.agent_id === agentId && a.capability_type === 'mcp' && a.is_enabled
        );
        return mcps.filter((m) =>
            mcpAssignments.some((a) => a.capability_id === m.id)
        );
    },

    getAssignedSkillsForAgent: (agentId) => {
        const { assignments, skills } = get();
        const skillAssignments = assignments.filter(
            (a) => a.agent_id === agentId && a.capability_type === 'skill' && a.is_enabled
        );
        return skills.filter((s) =>
            skillAssignments.some((a) => a.capability_id === s.id)
        );
    },
}));
