export type AgentId = 'daisy' | 'ivy' | 'celia' | 'thalia' | 'agent-zero' | string;

export function getAgentColor(agentId: AgentId): string {
    const id = agentId.toLowerCase();
    switch (id) {
        case 'daisy': return 'var(--agent-daisy)';      // lime
        case 'ivy': return 'var(--agent-ivy)';          // teal
        case 'celia': return 'var(--agent-celia)';      // violet
        case 'thalia': return 'var(--agent-thalia)';    // coral
        case 'agent-zero': return 'var(--agent-zero)';  // ocean blue
        default: return 'var(--accent-base)';           // fallback orange
    }
}

export function getAgentColorRaw(agentId: AgentId): string {
    const id = agentId.toLowerCase();
    switch (id) {
        case 'daisy': return 'oklch(0.78 0.17 135)';
        case 'ivy': return 'oklch(0.72 0.14 195)';
        case 'celia': return 'oklch(0.55 0.14 290)';
        case 'thalia': return 'oklch(0.65 0.19 25)';
        case 'agent-zero': return 'oklch(0.55 0.15 232)';
        default: return 'oklch(0.72 0.18 52)';
    }
}

export function getAgentColorSoft(agentId: AgentId): string {
    const id = agentId.toLowerCase();
    switch (id) {
        case 'daisy': return 'var(--accent-lime-soft)';
        case 'ivy': return 'var(--accent-teal-soft)';
        case 'celia': return 'var(--accent-violet-soft)';
        case 'thalia': return 'var(--accent-coral-soft)';
        case 'agent-zero': return 'var(--accent-ocean-soft)';
        default: return 'var(--accent-subtle)'; // general fallback
    }
}

export const KNOWN_AGENTS = [
    { id: 'daisy', name: 'Daisy', model: 'gemini-3-flash', type: 'openclaw' as const },
    { id: 'ivy', name: 'Ivy', model: 'gemini-3-flash', type: 'openclaw' as const },
    { id: 'celia', name: 'Celia', model: 'gemini-3-flash', type: 'openclaw' as const },
    { id: 'thalia', name: 'Thalia', model: 'gemini-3-flash', type: 'openclaw' as const },
    { id: 'agent-zero', name: 'Agent Zero', model: 'configurable', type: 'external' as const },
] as const;
