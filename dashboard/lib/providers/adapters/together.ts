import type { ProviderAdapter, ProviderConfig, ProviderMeta, ProviderStatus, ModelInfo } from '../types';

const META: ProviderMeta = {
    type: 'together',
    displayName: 'Together AI',
    description: 'Open-source models at scale',
    docsUrl: 'https://docs.together.ai',
    defaultBaseUrl: 'https://api.together.xyz',
    supportsStreaming: true,
    requiresApiKey: true,
};

const DEFAULT_MODELS: ModelInfo[] = [
    { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B Turbo', contextWindow: 131072, pricingInput: '$0.88', pricingOutput: '$0.88' },
    { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', name: 'Qwen 2.5 72B Turbo', contextWindow: 131072, pricingInput: '$1.20', pricingOutput: '$1.20' },
    { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3', contextWindow: 65536, pricingInput: '$0.90', pricingOutput: '$0.90' },
];

export class TogetherAdapter implements ProviderAdapter {
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
