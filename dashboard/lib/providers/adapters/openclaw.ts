import type { ProviderAdapter, ProviderConfig, ProviderMeta, ProviderStatus, ModelInfo } from '../types';

const META: ProviderMeta = {
    type: 'openclaw',
    displayName: 'OpenClaw',
    description: 'Native OpenClaw gateway — your current orchestration backend',
    docsUrl: 'https://openclaw.ai/docs',
    defaultBaseUrl: 'http://127.0.0.1:18789',
    supportsStreaming: true,
    requiresApiKey: false,
};

const DEFAULT_MODELS: ModelInfo[] = [
    { id: 'google-antigravity/gemini-3-flash', name: 'Gemini 3 Flash (via OpenClaw)', contextWindow: 1048576 },
    { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro (via OpenClaw)', contextWindow: 1048576 },
    { id: 'google-antigravity/claude-opus-4-6-thinking', name: 'Claude Opus 4.6 Thinking (via OpenClaw)', contextWindow: 200000 },
    { id: 'google-antigravity/claude-sonnet-4-5', name: 'Claude Sonnet 4.5 (via OpenClaw)', contextWindow: 200000 },
    { id: 'openrouter/auto', name: 'OpenRouter Auto (via OpenClaw)' },
];

export class OpenClawAdapter implements ProviderAdapter {
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
            // OpenClaw health endpoint
            const res = await fetch(`${baseUrl}/health`);
            if (!res.ok) return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
            return { success: true };
        } catch (err: unknown) {
            return { success: false, error: err instanceof Error ? err.message : 'OpenClaw gateway not reachable' };
        }
    }

    async listModels(_config: ProviderConfig): Promise<ModelInfo[]> {
        return DEFAULT_MODELS;
    }

    getStatus(): ProviderStatus { return this.status; }
}
