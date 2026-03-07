import type { ProviderAdapter, ProviderConfig, ProviderMeta, ProviderStatus, ModelInfo } from '../types';

const META: ProviderMeta = {
    type: 'ollama',
    displayName: 'Ollama',
    description: 'Local models — run AI on your own hardware',
    docsUrl: 'https://ollama.com',
    defaultBaseUrl: 'http://localhost:11434',
    supportsStreaming: true,
    requiresApiKey: false,
};

export class OllamaAdapter implements ProviderAdapter {
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
            const res = await fetch(`${baseUrl}/api/tags`);
            if (!res.ok) return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
            return { success: true };
        } catch (err: unknown) {
            return { success: false, error: err instanceof Error ? err.message : 'Ollama not reachable — is it running?' };
        }
    }

    async listModels(config: ProviderConfig): Promise<ModelInfo[]> {
        try {
            const baseUrl = config.baseUrl || META.defaultBaseUrl;
            const res = await fetch(`${baseUrl}/api/tags`);
            if (!res.ok) return [];
            const data = await res.json();
            return (data.models || []).map((m: { name: string; size?: number }) => ({
                id: m.name,
                name: m.name,
                contextWindow: undefined,
            }));
        } catch {
            return [];
        }
    }

    getStatus(): ProviderStatus { return this.status; }
}
