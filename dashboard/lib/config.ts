/**
 * Centralized runtime configuration for VPS connections.
 * Client-safe values come from NEXT_PUBLIC_* env vars.
 * Server-only secrets are accessed only in API route handlers.
 */

// --- Client-safe (available in browser) ---

export const OPENCLAW_WS_URL =
    process.env.NEXT_PUBLIC_OPENCLAW_WS_URL ??
    process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_URL ??
    'ws://127.0.0.1:18789';

export const OPENCLAW_HTTP_URL =
    process.env.NEXT_PUBLIC_OPENCLAW_HTTP_URL ??
    'http://127.0.0.1:18789';

export const AGENT_ZERO_BASE_URL =
    process.env.NEXT_PUBLIC_AGENT_ZERO_BASE_URL ??
    process.env.NEXT_PUBLIC_AGENT_ZERO_URL ??
    'http://127.0.0.1:80';

export const AGENT_ZERO_WS_ENABLED =
    process.env.NEXT_PUBLIC_AGENT_ZERO_WS_ENABLED === 'true';

// Compute whether we're connecting to remote VPS (not localhost)
export const IS_REMOTE_OPENCLAW =
    !OPENCLAW_WS_URL.includes('127.0.0.1') &&
    !OPENCLAW_WS_URL.includes('localhost');

export const IS_REMOTE_AGENT_ZERO =
    !AGENT_ZERO_BASE_URL.includes('127.0.0.1') &&
    !AGENT_ZERO_BASE_URL.includes('localhost');

// --- Server-only (NEVER import these in a client component) ---

/**
 * Get the OpenClaw auth token for server-side use only.
 * Throws if not configured.
 */
export function getOpenClawToken(): string {
    const token = process.env.OPENCLAW_AUTH_TOKEN ??
                  process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_TOKEN;
    if (!token) {
        throw new Error('OPENCLAW_AUTH_TOKEN is not set in environment');
    }
    return token;
}

/**
 * Get the OpenClaw auth token, returning null if not configured.
 * Use this for optional auth scenarios.
 */
export function getOpenClawTokenOptional(): string | null {
    return process.env.OPENCLAW_AUTH_TOKEN ??
           process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_TOKEN ??
           null;
}

/**
 * Get the Agent Zero API key for server-side use only.
 * Throws if not configured.
 */
export function getAgentZeroApiKey(): string {
    const key = process.env.AGENT_ZERO_API_KEY;
    if (!key) {
        throw new Error('AGENT_ZERO_API_KEY is not set in environment');
    }
    return key;
}

/**
 * Get the Agent Zero API key, returning null if not configured.
 */
export function getAgentZeroApiKeyOptional(): string | null {
    return process.env.AGENT_ZERO_API_KEY ?? null;
}

/**
 * Get the Agent Zero base URL for server-side use.
 */
export function getAgentZeroUrl(): string {
    return process.env.AGENT_ZERO_URL ??
           process.env.NEXT_PUBLIC_AGENT_ZERO_BASE_URL ??
           'http://127.0.0.1:80';
}
