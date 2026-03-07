// ─── Provider Type Definitions ───────────────────────────────────────────────

export type ProviderType =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'deepseek'
  | 'groq'
  | 'mistral'
  | 'xai'
  | 'ollama'
  | 'together'
  | 'openclaw';

export type ProviderStatus = 'connected' | 'degraded' | 'disconnected' | 'unknown';

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  customHeaders?: Record<string, string>;
  rateLimit?: number; // requests per minute
}

export interface ModelInfo {
  id: string;
  name: string;
  contextWindow?: number;
  pricingInput?: string;  // cost per 1M input tokens, e.g. "$3.00"
  pricingOutput?: string; // cost per 1M output tokens
}

export interface ProviderMeta {
  type: ProviderType;
  displayName: string;
  description: string;
  iconUrl?: string;
  docsUrl?: string;
  defaultBaseUrl: string;
  supportsStreaming: boolean;
  requiresApiKey: boolean;
}

/**
 * ProviderAdapter — interface every provider must implement.
 * Adapters handle configuration management, health checking,
 * and model discovery. Actual LLM calls route through OpenClaw.
 */
export interface ProviderAdapter {
  readonly meta: ProviderMeta;

  /** Validate credentials and establish readiness */
  connect(config: ProviderConfig): Promise<void>;

  /** Tear down any open connections */
  disconnect(): Promise<void>;

  /** Lightweight health check (e.g., list models endpoint) */
  testConnection(config: ProviderConfig): Promise<{ success: boolean; error?: string }>;

  /** Return available models for this provider */
  listModels(config: ProviderConfig): Promise<ModelInfo[]>;

  /** Current connection status */
  getStatus(): ProviderStatus;
}

/** Persisted provider record (matches DB schema) */
export interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  encryptedApiKey?: string;
  baseUrl?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

/** Agent ↔ Provider binding */
export interface AgentProviderBinding {
  agentId: string;
  primaryProviderId?: string;
  backupProviderId?: string;
  modelId?: string;
  config?: Record<string, unknown>;
}
