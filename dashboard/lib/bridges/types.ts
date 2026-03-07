// ─── Platform Bridges Types ────────────────────────────────────────────────────

export type PlatformType = 'discord' | 'slack' | 'github' | 'telegram';
export type BridgeStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface BridgeConfig {
    id: string;
    platform: PlatformType;
    name: string;
    status: BridgeStatus;
    apiKey?: string;        // Bot token, Slack token, GitHub App key, etc.
    webhookUrl?: string;    // Inbound webhook
    settings: Record<string, unknown>; // specific settings per platform (e.g. repo mapping, channel mapping)
    assignedAgents: string[]; // which agents are active on this bridge
    lastSyncedAt?: number;
    createdAt: number;
    updatedAt: number;
}

export const PLATFORM_METADATA: Record<PlatformType, { name: string; description: string; color: string }> = {
    discord: { name: 'Discord', description: 'Bot for server messaging and thread replies', color: 'text-indigo-400' },
    slack: { name: 'Slack', description: 'App for channel chat and direct messages', color: 'text-rose-400' },
    github: { name: 'GitHub', description: 'App for PR review, issue assignment', color: 'text-slate-200' },
    telegram: { name: 'Telegram', description: 'Bot for mobile direct messages', color: 'text-sky-400' },
};
