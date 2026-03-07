import type { ProviderAdapter, ProviderConfig, ProviderMeta, ProviderStatus, ModelInfo } from '../types';

const META: ProviderMeta = {
    type: 'xai',
    displayName: 'xAI',
    description: 'Grok models by xAI',
    docsUrl: 'https://docs.x.ai',
    defaultBaseUrl: 'https://api.x.ai',
    supportsStreaming: true,
    requiresApiKey: true,
};

const DEFAULT_MODELS: ModelInfo[] = [
    { id: 'grok-3', name: 'Grok 3', contextWindow: 131072, pricingInput: '$3.00', pricingOutput: '$15.00' },
    { id: 'grok-3-mini', name: 'Grok 3 Mini', contextWindow: 131072, pricingInput: '$0.30', pricingOutput: '$0.50' },
    { id: 'grok-2', name: 'Grok 2', contextWindow: 131072, pricingInput: '$2.00', pricingOutput: '$10.00' },
];

export class XAIAdapter implements ProviderAdapter {
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
