import type { ProviderAdapter, ProviderConfig, ProviderMeta, ProviderStatus, ModelInfo } from '../types';

const META: ProviderMeta = {
    type: 'mistral',
    displayName: 'Mistral',
    description: 'Mistral AI — efficient open and commercial models',
    docsUrl: 'https://docs.mistral.ai',
    defaultBaseUrl: 'https://api.mistral.ai',
    supportsStreaming: true,
    requiresApiKey: true,
};

const DEFAULT_MODELS: ModelInfo[] = [
    { id: 'mistral-large-latest', name: 'Mistral Large', contextWindow: 131072, pricingInput: '$2.00', pricingOutput: '$6.00' },
    { id: 'mistral-medium-latest', name: 'Mistral Medium', contextWindow: 131072, pricingInput: '$0.40', pricingOutput: '$2.00' },
    { id: 'mistral-small-latest', name: 'Mistral Small', contextWindow: 131072, pricingInput: '$0.10', pricingOutput: '$0.30' },
    { id: 'codestral-latest', name: 'Codestral', contextWindow: 262144, pricingInput: '$0.30', pricingOutput: '$0.90' },
];

export class MistralAdapter implements ProviderAdapter {
    readonly meta = META;
    private status: ProviderStatus = 'unknown';

    async connect(config: ProviderConfig): Promise<void> {
        const result = await this.testConnection(config);
        this.status = result.success ? 'connected' : 'disconnected';
    }

    async disconnect(): Promise<void> { this.status = 'disconnected'; }

    async testConnection(config: ProviderConfig): Promise<{ success: boolean; error?: string }> {
        try {
            const baseUrl = config.baseUrl || META.defaultBaseUrl;
            const res = await fetch(`${baseUrl}/v1/models`, {
                headers: { 'Authorization': `Bearer ${config.apiKey || ''}` },
            });
            if (!res.ok) return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
            return { success: true };
        } catch (err: unknown) {
            return { success: false, error: err instanceof Error ? err.message : 'Connection failed' };
        }
    }

    async listModels(_config: ProviderConfig): Promise<ModelInfo[]> {
        return DEFAULT_MODELS;
    }

    getStatus(): ProviderStatus { return this.status; }
}
