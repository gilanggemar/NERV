import { create } from 'zustand';
import type { MCPServer } from '@/lib/mcp/types';

interface MCPState {
    servers: MCPServer[];
    isLoading: boolean;

    fetchServers: () => Promise<void>;
    testServer: (id: string) => Promise<void>;
}

export const useMCPStore = create<MCPState>((set, get) => ({
    servers: [],
    isLoading: false,

    fetchServers: async () => {
        set({ isLoading: true });
        try {
            const res = await fetch('/api/mcp/servers');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) set({ servers: data });
            }
        } catch (e) {
            console.error('Failed:', e);
        } finally {
            set({ isLoading: false });
        }
    },

    testServer: async (id) => {
        try {
            const res = await fetch(`/api/mcp/servers/${id}/test`, { method: 'POST' });
            if (res.ok) get().fetchServers();
        } catch (e) {
            console.error('Failed:', e);
        }
    },
}));
