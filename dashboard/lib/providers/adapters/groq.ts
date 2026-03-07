import type { ProviderAdapter, ProviderConfig, ProviderMeta, ProviderStatus, ModelInfo } from '../types';

const META: ProviderMeta = {
    type: 'groq',
    displayName: 'Groq',
    description: 'Ultra-fast inference on open models',
    docsUrl: 'https://console.groq.com/docs',
    defaultBaseUrl: 'https://api.groq.com/openai',
    supportsStreaming: true,
    requiresApiKey: true,
};

const DEFAULT_MODELS: ModelInfo[] = [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', contextWindow: 131072, pricingInput: '$0.59', pricingOutput: '$0.79' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', contextWindow: 131072, pricingInput: '$0.05', pricingOutput: '$0.08' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', contextWindow: 32768, pricingInput: '$0.24', pricingOutput: '$0.24' },
    { id: 'gemma2-9b-it', name: 'Gemma 2 9B', contextWindow: 8192, pricingInput: '$0.20', pricingOutput: '$0.20' },
];

export class GroqAdapter implements ProviderAdapter {
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
