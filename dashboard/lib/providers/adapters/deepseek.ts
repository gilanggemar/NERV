import type { ProviderAdapter, ProviderConfig, ProviderMeta, ProviderStatus, ModelInfo } from '../types';

const META: ProviderMeta = {
    type: 'deepseek',
    displayName: 'DeepSeek',
    description: 'DeepSeek reasoning and code models',
    docsUrl: 'https://platform.deepseek.com/docs',
    defaultBaseUrl: 'https://api.deepseek.com',
    supportsStreaming: true,
    requiresApiKey: true,
};

const DEFAULT_MODELS: ModelInfo[] = [
    { id: 'deepseek-chat', name: 'DeepSeek V3', contextWindow: 65536, pricingInput: '$0.27', pricingOutput: '$1.10' },
    { id: 'deepseek-reasoner', name: 'DeepSeek R1', contextWindow: 65536, pricingInput: '$0.55', pricingOutput: '$2.19' },
];

export class DeepSeekAdapter implements ProviderAdapter {
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
