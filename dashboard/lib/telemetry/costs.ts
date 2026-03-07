// ─── Model Pricing & Cost Calculator ─────────────────────────────────────────
//
// Cost per 1M tokens (USD). Used to calculate telemetry cost_usd.

interface ModelPricing {
    inputPer1M: number;
    outputPer1M: number;
}

const PRICING_TABLE: Record<string, ModelPricing> = {
    // Anthropic
    'claude-sonnet-4-5-20250514': { inputPer1M: 3.00, outputPer1M: 15.00 },
    'claude-opus-4-20250514': { inputPer1M: 15.00, outputPer1M: 75.00 },
    'claude-haiku-3-5-20250514': { inputPer1M: 0.80, outputPer1M: 4.00 },
    // OpenAI
    'gpt-4o': { inputPer1M: 2.50, outputPer1M: 10.00 },
    'gpt-4o-mini': { inputPer1M: 0.15, outputPer1M: 0.60 },
    'o3': { inputPer1M: 2.00, outputPer1M: 8.00 },
    'o4-mini': { inputPer1M: 1.10, outputPer1M: 4.40 },
    // Google
    'gemini-2.5-pro': { inputPer1M: 1.25, outputPer1M: 10.00 },
    'gemini-2.5-flash': { inputPer1M: 0.15, outputPer1M: 0.60 },
    'gemini-2.0-flash': { inputPer1M: 0.10, outputPer1M: 0.40 },
    'gemini-3-flash': { inputPer1M: 0.10, outputPer1M: 0.40 },
    // DeepSeek
    'deepseek-chat': { inputPer1M: 0.27, outputPer1M: 1.10 },
    'deepseek-reasoner': { inputPer1M: 0.55, outputPer1M: 2.19 },
    // Groq
    'llama-3.3-70b-versatile': { inputPer1M: 0.59, outputPer1M: 0.79 },
    'llama-3.1-8b-instant': { inputPer1M: 0.05, outputPer1M: 0.08 },
    // Mistral
    'mistral-large-latest': { inputPer1M: 2.00, outputPer1M: 6.00 },
    'mistral-small-latest': { inputPer1M: 0.10, outputPer1M: 0.30 },
    'codestral-latest': { inputPer1M: 0.30, outputPer1M: 0.90 },
    // xAI
    'grok-3': { inputPer1M: 3.00, outputPer1M: 15.00 },
    'grok-3-mini': { inputPer1M: 0.30, outputPer1M: 0.50 },
};

// Default fallback for unknown models
const DEFAULT_PRICING: ModelPricing = { inputPer1M: 1.00, outputPer1M: 3.00 };

/**
 * Calculate the cost in USD for a given model and token count.
 */
export function calculateCost(
    model: string,
    inputTokens: number,
    outputTokens: number
): number {
    // Try exact match first, then partial match
    let pricing = PRICING_TABLE[model];
    if (!pricing) {
        const key = Object.keys(PRICING_TABLE).find((k) =>
            model.toLowerCase().includes(k.toLowerCase())
        );
        pricing = key ? PRICING_TABLE[key] : DEFAULT_PRICING;
    }

    const inputCost = (inputTokens / 1_000_000) * pricing.inputPer1M;
    const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M;
    return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000; // 6 decimal places
}

/**
 * Format a USD cost for display.
 */
export function formatCost(usd: number): string {
    if (usd < 0.01) return `$${usd.toFixed(4)}`;
    if (usd < 1) return `$${usd.toFixed(3)}`;
    return `$${usd.toFixed(2)}`;
}

export { PRICING_TABLE, DEFAULT_PRICING };

/**
 * Helper to create a telemetry entry with calculated cost.
 * Use with logTelemetry() from logger.ts
 */
export function createTelemetryEntry(params: {
    agentId: string;
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
    status: 'success' | 'error';
    taskId?: string;
    errorMessage?: string;
}) {
    const costUsd = calculateCost(params.model, params.inputTokens, params.outputTokens);
    return {
        timestamp: Date.now(),
        agentId: params.agentId,
        provider: params.provider,
        model: params.model,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        costUsd: costUsd.toFixed(6),
        latencyMs: params.latencyMs,
        status: params.status,
        taskId: params.taskId,
        errorMessage: params.errorMessage,
    };
}
