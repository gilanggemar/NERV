// ─── Provider Registry ───────────────────────────────────────────────────────
//
// Singleton registry of all available provider adapters.
// Adapters are auto-registered at import time.

import type { ProviderAdapter, ProviderType } from './types';

import { AnthropicAdapter } from './adapters/anthropic';
import { OpenAIAdapter } from './adapters/openai';
import { GoogleAdapter } from './adapters/google';
import { DeepSeekAdapter } from './adapters/deepseek';
import { GroqAdapter } from './adapters/groq';
import { MistralAdapter } from './adapters/mistral';
import { XAIAdapter } from './adapters/xai';
import { OllamaAdapter } from './adapters/ollama';
import { TogetherAdapter } from './adapters/together';
import { OpenClawAdapter } from './adapters/openclaw';

class ProviderRegistry {
    private adapters = new Map<ProviderType, ProviderAdapter>();

    constructor() {
        // Auto-register all built-in adapters
        this.register(new AnthropicAdapter());
        this.register(new OpenAIAdapter());
        this.register(new GoogleAdapter());
        this.register(new DeepSeekAdapter());
        this.register(new GroqAdapter());
        this.register(new MistralAdapter());
        this.register(new XAIAdapter());
        this.register(new OllamaAdapter());
        this.register(new TogetherAdapter());
        this.register(new OpenClawAdapter());
    }

    /** Register a provider adapter */
    register(adapter: ProviderAdapter): void {
        this.adapters.set(adapter.meta.type, adapter);
    }

    /** Get adapter by provider type */
    get(type: ProviderType): ProviderAdapter | undefined {
        return this.adapters.get(type);
    }

    /** List all registered adapter metadata */
    list() {
        return Array.from(this.adapters.values()).map((a) => a.meta);
    }

    /** Get all registered types */
    types(): ProviderType[] {
        return Array.from(this.adapters.keys());
    }
}

// Singleton instance
export const providerRegistry = new ProviderRegistry();
