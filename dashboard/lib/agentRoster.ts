export interface AgentProfile {
    id: string;
    name: string;
    codename: string;
    color: string;
    colorHex: string;
    accentOklch: string;
    role: string;
    specialty: string[];
    description: string;
    avatarFallback: string;
    avatar?: string;
}

export const AGENT_ROSTER: AgentProfile[] = [
    {
        id: 'daisy',
        name: 'Daisy',
        codename: 'DAISY',
        color: '--agent-daisy',
        colorHex: '#a3e635',
        accentOklch: 'oklch(0.78 0.17 135)',
        role: 'Research Analyst',
        specialty: ['Research', 'Writing', 'Summarization'],
        description: 'Deep research and synthesis across any domain',
        avatarFallback: 'DA',
        avatar: '/agents/daisy.png'
    },
    {
        id: 'ivy',
        name: 'Ivy',
        codename: 'IVY',
        color: '--agent-ivy',
        colorHex: '#22d3ee',
        accentOklch: 'oklch(0.72 0.14 195)',
        role: 'Code Architect',
        specialty: ['Code', 'Analysis', 'Debugging'],
        description: 'Full-stack engineering and system design',
        avatarFallback: 'IV',
        avatar: '/agents/ivy.png'
    },
    {
        id: 'celia',
        name: 'Celia',
        codename: 'CELIA',
        color: '--agent-celia',
        colorHex: '#a78bfa',
        accentOklch: 'oklch(0.55 0.14 290)',
        role: 'Creative Director',
        specialty: ['Creative', 'Strategy', 'UX'],
        description: 'Creative ideation and strategic thinking',
        avatarFallback: 'CE',
        avatar: '/agents/celia.png'
    },
    {
        id: 'thalia',
        name: 'Thalia',
        codename: 'THALIA',
        color: '--agent-thalia',
        colorHex: '#fb7185',
        accentOklch: 'oklch(0.65 0.19 25)',
        role: 'Operations Lead',
        specialty: ['Planning', 'Coordination', 'Logistics'],
        description: 'Task orchestration and operational planning',
        avatarFallback: 'TH',
        avatar: '/agents/thalia.png'
    },
    {
        id: 'agent-zero',
        name: 'Zero',
        codename: 'ZERO',
        color: '--agent-zero',
        colorHex: '#38bdf8',
        accentOklch: 'oklch(0.55 0.15 232)',
        role: 'Core System',
        specialty: ['Core System', 'Overseer', 'All'],
        description: 'Core autonomous agent with full system access',
        avatarFallback: 'ZE',
        avatar: '/agents/zero.png'
    },
];

export function getAgentProfile(id: string): AgentProfile | undefined {
    return AGENT_ROSTER.find((a) => a.id === id);
}

export function getAgentColor(id: string): string {
    return getAgentProfile(id)?.colorHex ?? '#FF6D29';
}
