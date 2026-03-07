import { create } from 'zustand';
import type { BridgeConfig } from '@/lib/bridges/types';

interface BridgesState {
    bridges: BridgeConfig[];
    isLoading: boolean;
    fetchBridges: () => Promise<void>;
}

export const useBridgesStore = create<BridgesState>((set) => ({
    bridges: [],
    isLoading: false,

    fetchBridges: async () => {
        set({ isLoading: true });
        try {
            const res = await fetch('/api/bridges');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) set({ bridges: data });
            }
        } catch (e) {
            console.error('Failed to fetch bridges:', e);
        } finally {
            set({ isLoading: false });
        }
    },
}));
