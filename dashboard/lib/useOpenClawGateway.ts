// dashboard/lib/useOpenClawGateway.ts
//
// React hook that wraps OpenClawGateway and pipes events into Zustand stores.
// This is the new canonical gateway integration layer.

import { useEffect, useRef, useCallback } from "react";
import { OpenClawGateway } from "./openclawGateway";
import { useOpenClawStore } from "@/store/useOpenClawStore";

// ── Env var fallback (always available, no async) ──

const ENV_WS_URL =
    process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_URL ||
    process.env.NEXT_PUBLIC_OPENCLAW_WS_URL ||
    "";
const ENV_TOKEN =
    process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_TOKEN || "";

function getGatewayUrl(): string {
    if (ENV_WS_URL) return ENV_WS_URL;
    if (typeof window !== "undefined") {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        return `${protocol}//${window.location.host}/api/openclaw-socket`;
    }
    return "ws://127.0.0.1:18789";
}

// ── Singleton ──

let gatewayInstance: OpenClawGateway | null = null;

export function getGateway(): OpenClawGateway {
    if (!gatewayInstance) {
        gatewayInstance = new OpenClawGateway({
            url: getGatewayUrl(),
            token: ENV_TOKEN,
        });
    }
    return gatewayInstance;
}

/**
 * Fetch the active profile's OpenClaw config from the server and
 * reconfigure the gateway singleton if the profile has different settings.
 * Safe to call multiple times — only reconfigure if URL/token actually changed.
 */
export async function loadProfileAndReconfigure(): Promise<void> {
    try {
        const res = await fetch("/api/connection-profiles/active/ws-token");
        if (!res.ok) return; // fallback to current config
        const data = await res.json();
        if (!data.enabled || !data.wsUrl) return;

        const gw = getGateway();
        const currentUrl = (gw as any).config?.url;
        const currentToken = (gw as any).config?.token;

        // Only reconfigure if something actually changed
        if (data.wsUrl !== currentUrl || data.token !== currentToken) {
            console.log("[useOpenClawGateway] Profile differs from current config, reconfiguring...");
            gw.reconfigure(data.wsUrl, data.token || "");
        }
    } catch {
        // Profile fetch failed — keep using current config (env vars)
        console.warn("[useOpenClawGateway] Failed to load active profile config, using env vars.");
    }
}

/**
 * Reconfigure the gateway with explicit URL/token.
 * Called from profile switching in the settings UI.
 */
export function reconfigureGateway(wsUrl: string, token: string): void {
    const gw = getGateway();
    gw.reconfigure(wsUrl, token);
}

export function useOpenClawGateway() {
    const gateway = useRef(getGateway());
    const isConnected = useOpenClawStore((s) => s.isConnected);
    const gatewayInfo = useOpenClawStore((s) => s.gatewayInfo);

    useEffect(() => {
        const gw = gateway.current;

        // --- Event subscriptions ---
        const unsubs: (() => void)[] = [];

        // Connection status
        unsubs.push(
            gw.on("connection_status", (payload) => {
                useOpenClawStore.getState().setConnected(payload.connected);
                if (payload.handshake) {
                    useOpenClawStore.getState().setGatewayInfo(payload.handshake);
                }
            })
        );

        // Agent events — the core event for tool calls, thinking, lifecycle, text deltas
        unsubs.push(
            gw.on("agent", (payload) => {
                useOpenClawStore.getState().handleAgentEvent(payload);
            })
        );

        // Chat events (messages sent/received on channels)
        unsubs.push(
            gw.on("chat", (payload) => {
                useOpenClawStore.getState().handleChatEvent(payload);
            })
        );

        // Presence events
        unsubs.push(
            gw.on("presence", (payload) => {
                useOpenClawStore.getState().handlePresenceEvent(payload);
            })
        );

        // Health telemetry
        unsubs.push(
            gw.on("health", (payload) => {
                useOpenClawStore.getState().handleHealthEvent(payload);
            })
        );

        // Exec approval requests
        unsubs.push(
            gw.on("exec.approval.requested", (payload) => {
                useOpenClawStore.getState().handleExecApprovalRequest(payload);
            })
        );

        // Tick (keepalive/sync)
        unsubs.push(
            gw.on("tick", (payload) => {
                useOpenClawStore.getState().setLastPing(Date.now());
            })
        );

        // Connect the gateway (uses env vars initially)
        gw.connect();

        // After connecting, check if the active profile has different settings
        loadProfileAndReconfigure();

        // Cleanup on unmount
        return () => {
            unsubs.forEach((unsub) => unsub());
            // Do NOT disconnect the singleton — other components may need it.
            // Only disconnect when the entire app unmounts (handled in ClientShell).
        };
    }, []);

    // --- Public actions ---

    const sendMessage = useCallback(
        async (message: string, sessionKey?: string) => {
            const gw = gateway.current;
            if (!gw.isConnected) {
                throw new Error("Not connected to OpenClaw Gateway");
            }
            const response = await gw.request("chat.send", {
                message,
                sessionKey: sessionKey || "agent:default:main",
                idempotencyKey: crypto.randomUUID(),
            });
            return response;
        },
        []
    );

    const getChatHistory = useCallback(
        async (sessionKey?: string) => {
            const gw = gateway.current;
            if (!gw.isConnected) {
                throw new Error("Not connected to OpenClaw Gateway");
            }
            const response = await gw.request("chat.history", {
                sessionKey: sessionKey || "agent:default:main",
            });
            return response;
        },
        []
    );

    const listSessions = useCallback(async () => {
        const gw = gateway.current;
        if (!gw.isConnected) {
            throw new Error("Not connected to OpenClaw Gateway");
        }
        return await gw.request("sessions.list", { limit: 50 });
    }, []);

    const listAgents = useCallback(async () => {
        const gw = gateway.current;
        if (!gw.isConnected) {
            throw new Error("Not connected to OpenClaw Gateway");
        }
        return await gw.request("agents.list", {});
    }, []);

    const getToolsCatalog = useCallback(async (agentId?: string) => {
        const gw = gateway.current;
        if (!gw.isConnected) {
            throw new Error("Not connected to OpenClaw Gateway");
        }
        return await gw.request("tools.catalog", { agentId: agentId || "default" });
    }, []);

    const getHealth = useCallback(async () => {
        const gw = gateway.current;
        if (!gw.isConnected) {
            throw new Error("Not connected to OpenClaw Gateway");
        }
        return await gw.request("health", {});
    }, []);

    const approveExec = useCallback(
        async (approvalId: string, approved: boolean) => {
            const gw = gateway.current;
            if (!gw.isConnected) {
                throw new Error("Not connected to OpenClaw Gateway");
            }
            return await gw.request("exec.approval.resolve", {
                id: approvalId,
                approved,
                idempotencyKey: crypto.randomUUID(),
            });
        },
        []
    );

    return {
        isConnected,
        gatewayInfo,
        sendMessage,
        getChatHistory,
        listSessions,
        listAgents,
        getToolsCatalog,
        getHealth,
        approveExec,
    };
}
