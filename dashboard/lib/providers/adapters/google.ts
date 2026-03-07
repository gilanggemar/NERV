import type { ProviderAdapter, ProviderConfig, ProviderMeta, ProviderStatus, ModelInfo } from '../types';

const META: ProviderMeta = {
    type: 'google',
    displayName: 'Google Gemini',
    description: 'Gemini family of multimodal models',
    docsUrl: 'https://ai.google.dev/docs',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com',
    supportsStreaming: true,
    requiresApiKey: true,
};

const DEFAULT_MODELS: ModelInfo[] = [
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', contextWindow: 1048576, pricingInput: '$1.25', pricingOutput: '$10.00' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', contextWindow: 1048576, pricingInput: '$0.15', pricingOutput: '$0.60' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', contextWindow: 1048576, pricingInput: '$0.10', pricingOutput: '$0.40' },
];

export class GoogleAdapter implements ProviderAdapter {
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
            const res = await fetch(`${baseUrl}/v1beta/models?key=${config.apiKey || ''}`);
            if (!res.ok) return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
            return { success: true };
        } catch (err: unknown) {
            return { success: false, error: err instanceof Error ? err.message : 'Connection failed' };
        }
    }

    async listModels(config: ProviderConfig): Promise<ModelInfo[]> {
        try {
            const baseUrl = config.baseUrl || META.defaultBaseUrl;
            const res = await fetch(`${baseUrl}/v1beta/models?key=${config.apiKey || ''}`);
            if (!res.ok) return DEFAULT_MODELS;
            const data = await res.json();
            return (data.models || []).slice(0, 20).map((m: { name: string; displayName?: string }) => ({
                id: m.name.replace('models/', ''),
                name: m.displayName || m.name,
            }));
        } catch {
            return DEFAULT_MODELS;
        }
    }

    getStatus(): ProviderStatus {
        return this.status;
    }
}
