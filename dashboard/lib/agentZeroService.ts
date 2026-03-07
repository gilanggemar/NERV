/**
 * Agent Zero Service
 *
 * Two-channel communication with Agent Zero:
 * Channel 1 — REST: Commands go through Next.js API proxy routes → Agent Zero REST API (X-API-KEY auth)
 * Channel 2 — Polling: Live state via GET /poll at ~4Hz (degraded fallback; WebSocket bridge future)
 *
 * The service NEVER calls Agent Zero directly from the browser.
 * All calls go through /api/agent-zero/* proxy routes.
 */

import { io, Socket } from 'socket.io-client';
import useAgentZeroStore from '@/store/useAgentZeroStore';
// Types
// ---------------------------------------------------------------------------

export interface A0SendMessageParams {
    message: string;
    context_id?: string;
    attachments?: { filename: string; base64: string }[];
    project?: string;
    lifetime_hours?: number;
}

export interface A0MessageResponse {
    response: string;
    context_id: string;
}

export interface A0LogResponse {
    context_id: string;
    log: {
        guid: string;
        total_items: number;
        returned_items: number;
        start_position: number;
        progress: string;
        items: any[];
    };
}

export interface A0HealthResponse {
    status: 'online' | 'offline' | 'unconfigured';
    url?: string;
    error?: string;
    timestamp?: number;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class AgentZeroService {
    private pollingTimer: ReturnType<typeof setInterval> | null = null;
    private pollingContextId: string | null = null;
    private socket: Socket | null = null;

    // ── Health Check ──────────────────────────────────────────────────────
    async checkHealth(): Promise<A0HealthResponse> {
        try {
            const res = await fetch('/api/agent-zero/health');
            return await res.json();
        } catch {
            return { status: 'offline', error: 'Network error' };
        }
    }

    // ── Send Message (REST) ───────────────────────────────────────────────
    async sendMessage(params: A0SendMessageParams): Promise<A0MessageResponse> {
        const res = await fetch('/api/agent-zero/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(err.error || `Agent Zero returned ${res.status}`);
        }

        return res.json();
    }

    // ── Get Logs ──────────────────────────────────────────────────────────
    async getLogs(contextId: string, length: number = 100): Promise<A0LogResponse> {
        const params = new URLSearchParams({ context_id: contextId, length: String(length) });
        const res = await fetch(`/api/agent-zero/logs?${params}`);

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(err.error || `Logs request failed: ${res.status}`);
        }

        return res.json();
    }

    // ── Reset Chat ────────────────────────────────────────────────────────
    async resetChat(contextId: string): Promise<{ message: string; context_id: string }> {
        const res = await fetch('/api/agent-zero/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ context_id: contextId }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(err.error || `Reset failed: ${res.status}`);
        }

        return res.json();
    }

    // ── Terminate Chat ────────────────────────────────────────────────────
    async terminateChat(contextId: string): Promise<{ message: string }> {
        const res = await fetch('/api/agent-zero/terminate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ context_id: contextId }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(err.error || `Terminate failed: ${res.status}`);
        }

        return res.json();
    }

    // ── Get Files ─────────────────────────────────────────────────────────
    async getFiles(paths: string[]): Promise<Record<string, string>> {
        const res = await fetch('/api/agent-zero/files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paths }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(err.error || `Files request failed: ${res.status}`);
        }

        return res.json();
    }

    // ── Poll State (fallback for WebSocket) ───────────────────────────────
    async pollState(): Promise<any> {
        const res = await fetch('/api/agent-zero/poll');

        if (!res.ok) {
            throw new Error(`Poll failed: ${res.status}`);
        }

        return res.json();
    }

    // ── Log Polling Control ──────────────────────────────────────────────────
    startLogPolling(contextId: string, intervalMs: number = 2000) {
        this.stopLogPolling();
        this.pollingContextId = contextId;

        const poll = async () => {
            try {
                const logsRes = await this.getLogs(contextId);
                useAgentZeroStore.getState().setLogs(logsRes.log?.items || []);
            } catch {
                // Polling failure is non-fatal — just skip this tick
            }
        };

        // First poll immediately
        poll();
        this.pollingTimer = setInterval(poll, intervalMs);
    }

    stopLogPolling() {
        if (this.pollingTimer) {
            clearInterval(this.pollingTimer);
            this.pollingTimer = null;
        }
        this.pollingContextId = null;
    }

    get isPolling() {
        return this.pollingTimer !== null;
    }

}

export const agentZeroService = new AgentZeroService();
