import type { ProviderAdapter, ProviderConfig, ProviderMeta, ProviderStatus, ModelInfo } from '../types';

const META: ProviderMeta = {
    type: 'openai',
    displayName: 'OpenAI',
    description: 'GPT and o-series models',
    docsUrl: 'https://platform.openai.com/docs',
    defaultBaseUrl: 'https://api.openai.com',
    supportsStreaming: true,
    requiresApiKey: true,
};

const DEFAULT_MODELS: ModelInfo[] = [
    { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000, pricingInput: '$2.50', pricingOutput: '$10.00' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000, pricingInput: '$0.15', pricingOutput: '$0.60' },
    { id: 'o3', name: 'o3', contextWindow: 200000, pricingInput: '$2.00', pricingOutput: '$8.00' },
    { id: 'o4-mini', name: 'o4-mini', contextWindow: 200000, pricingInput: '$1.10', pricingOutput: '$4.40' },
];

export class OpenAIAdapter implements ProviderAdapter {
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
                headers: {
                    'Authorization': `Bearer ${config.apiKey || ''}`,
                    ...config.customHeaders,
                },
            });
            if (!res.ok) return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
            return { success: true };
        } catch (err: unknown) {
            return { success: false, error: err instanceof Error ? err.message : 'Connection failed' };
        }
    }

    async listModels(config: ProviderConfig): Promise<ModelInfo[]> {
        try {
            const baseUrl = config.baseUrl || META.defaultBaseUrl;
            const res = await fetch(`${baseUrl}/v1/models`, {
                headers: { 'Authorization': `Bearer ${config.apiKey || ''}` },
            });
            if (!res.ok) return DEFAULT_MODELS;
            const data = await res.json();
            return (data.data || []).slice(0, 20).map((m: { id: string }) => ({
                id: m.id,
                name: m.id,
            }));
        } catch {
            return DEFAULT_MODELS;
        }
    }

    getStatus(): ProviderStatus {
        return this.status;
    }
}
