// ─── Provider Manager ────────────────────────────────────────────────────────
//
// Handles failover logic: if primary provider fails, switch to backup.
// Also provides health checking and provider selection per agent.

import type { ProviderConfig, ProviderStatus, ProviderType, ModelInfo } from './types';
import { providerRegistry } from './registry';

export interface AgentProviderMapping {
    agentId: string;
    primaryType: ProviderType;
    primaryConfig: ProviderConfig;
    backupType?: ProviderType;
    backupConfig?: ProviderConfig;
    modelId?: string;
}

interface ProviderHealthEntry {
    type: ProviderType;
    status: ProviderStatus;
    lastChecked: number;
    error?: string;
}

class ProviderManager {
    private healthCache = new Map<string, ProviderHealthEntry>();
    private agentMappings = new Map<string, AgentProviderMapping>();

    /** Register agent → provider mapping */
    setAgentProvider(mapping: AgentProviderMapping): void {
        this.agentMappings.set(mapping.agentId, mapping);
    }

    /** Get the active provider type for an agent (with failover) */
    getActiveProvider(agentId: string): { type: ProviderType; config: ProviderConfig } | null {
        const mapping = this.agentMappings.get(agentId);
        if (!mapping) return null;

        const primaryHealth = this.healthCache.get(mapping.primaryType);
        if (!primaryHealth || primaryHealth.status === 'connected' || primaryHealth.status === 'unknown') {
            return { type: mapping.primaryType, config: mapping.primaryConfig };
        }

        // Primary is down — failover to backup
        if (mapping.backupType && mapping.backupConfig) {
            const backupHealth = this.healthCache.get(mapping.backupType);
            if (!backupHealth || backupHealth.status !== 'disconnected') {
                return { type: mapping.backupType, config: mapping.backupConfig };
            }
        }

        // Both down — return primary anyway (let it fail with error)
        return { type: mapping.primaryType, config: mapping.primaryConfig };
    }

    /** Check health of a specific provider */
    async healthCheck(type: ProviderType, config: ProviderConfig): Promise<ProviderHealthEntry> {
        const adapter = providerRegistry.get(type);
        if (!adapter) {
            const entry: ProviderHealthEntry = { type, status: 'disconnected', lastChecked: Date.now(), error: 'Unknown provider type' };
            this.healthCache.set(type, entry);
            return entry;
        }

        const result = await adapter.testConnection(config);
        const entry: ProviderHealthEntry = {
            type,
            status: result.success ? 'connected' : 'disconnected',
            lastChecked: Date.now(),
            error: result.error,
        };
        this.healthCache.set(type, entry);
        return entry;
    }

    /** Get cached health for a provider */
    getCachedHealth(type: ProviderType): ProviderHealthEntry | undefined {
        return this.healthCache.get(type);
    }

    /** List models for a provider */
    async listModels(type: ProviderType, config: ProviderConfig): Promise<ModelInfo[]> {
        const adapter = providerRegistry.get(type);
        if (!adapter) return [];
        return adapter.listModels(config);
    }
}

// Singleton instance
export const providerManager = new ProviderManager();
