import type { ProviderAdapter, ProviderConfig, ProviderMeta, ProviderStatus, ModelInfo } from '../types';

const META: ProviderMeta = {
    type: 'anthropic',
    displayName: 'Anthropic',
    description: 'Claude models — advanced reasoning and coding',
    docsUrl: 'https://docs.anthropic.com',
    defaultBaseUrl: 'https://api.anthropic.com',
    supportsStreaming: true,
    requiresApiKey: true,
};

const DEFAULT_MODELS: ModelInfo[] = [
    { id: 'claude-sonnet-4-5-20250514', name: 'Claude Sonnet 4.5', contextWindow: 200000, pricingInput: '$3.00', pricingOutput: '$15.00' },
    { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', contextWindow: 200000, pricingInput: '$15.00', pricingOutput: '$75.00' },
    { id: 'claude-haiku-3-5-20250514', name: 'Claude Haiku 3.5', contextWindow: 200000, pricingInput: '$0.80', pricingOutput: '$4.00' },
];

export class AnthropicAdapter implements ProviderAdapter {
    readonly meta = META;
    private status: ProviderStatus = 'unknown';

    async connect(config: ProviderConfig): Promise<void> {
        const result = await this.testConnection(config);
        this.status = result.success ? 'connected' : 'disconnected';
    }

    async disconnect(): Promise<void> {
        this.status = 'disconnected';
    }

    async testConnection(config: ProviderConfig): Promise<{ success: boolean; error?: string }> {
        try {
            const baseUrl = config.baseUrl || META.defaultBaseUrl;
            const res = await fetch(`${baseUrl}/v1/models`, {
                method: 'GET',
                headers: {
                    'x-api-key': config.apiKey || '',
                    'anthropic-version': '2023-06-01',
                    ...config.customHeaders,
                },
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

    getStatus(): ProviderStatus {
        return this.status;
    }
}
