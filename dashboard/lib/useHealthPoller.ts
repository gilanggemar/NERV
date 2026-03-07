/**
 * Health Poller Hook
 *
 * Periodically checks VPS connection health for both OpenClaw and Agent Zero.
 * Should be called in ClientShell.tsx to initialize health monitoring.
 */

import { useEffect, useCallback } from 'react';
import { useOpenClawStore } from '@/store/useOpenClawStore';
import { useAgentZeroStore } from '@/store/useAgentZeroStore';

interface UseHealthPollerOptions {
    intervalMs?: number;
    enableAgentZero?: boolean;
    enableOpenClaw?: boolean;
}

export function useHealthPoller(options: UseHealthPollerOptions = {}) {
    const {
        intervalMs = 30000,
        enableAgentZero = true,
        enableOpenClaw = true,
    } = options;

    const openClawConnected = useOpenClawStore((s) => s.isConnected);
    const checkAgentZeroHealth = useAgentZeroStore((s) => s.checkVpsHealth);

    const performHealthCheck = useCallback(async () => {
        // Check Agent Zero health via REST API
        if (enableAgentZero) {
            try {
                await checkAgentZeroHealth();
            } catch (error) {
                console.warn('[HealthPoller] Agent Zero health check failed:', error);
            }
        }

        // OpenClaw health is tracked via WebSocket connection state
        // The store's isConnected field is updated by the gateway connection events
        // No additional REST call needed here since the WebSocket maintains its own heartbeat

    }, [enableAgentZero, checkAgentZeroHealth]);

    useEffect(() => {
        // Immediate health check on mount
        performHealthCheck();

        // Set up periodic polling
        const intervalId = setInterval(performHealthCheck, intervalMs);

        return () => {
            clearInterval(intervalId);
        };
    }, [performHealthCheck, intervalMs]);

    return {
        openClawConnected,
        agentZeroConnected: useAgentZeroStore((s) => s.vpsConnected),
        lastAgentZeroHealthCheck: useAgentZeroStore((s) => s.vpsLastHealthCheck),
        checkNow: performHealthCheck,
    };
}

export default useHealthPoller;
