import { create } from 'zustand';
import type { ProviderType, ProviderStatus } from '@/lib/providers/types';

// ─── Provider Store Types ────────────────────────────────────────────────────

export interface ProviderRecord {
    id: string;
    name: string;
    type: ProviderType;
    baseUrl?: string;
    isActive: boolean;
    maskedKey?: string;    // e.g., "sk-•••abc1"
    modelCount?: number;
    createdAt: number;
    updatedAt: number;
}

interface ProviderState {
    providers: Record<string, ProviderRecord>;
    statuses: Record<string, ProviderStatus>;
    isLoading: boolean;

    // Actions
    setProviders: (providers: ProviderRecord[]) => void;
    addProvider: (provider: ProviderRecord) => void;
    updateProvider: (id: string, updates: Partial<ProviderRecord>) => void;
    removeProvider: (id: string) => void;
    setStatus: (id: string, status: ProviderStatus) => void;
    setLoading: (loading: boolean) => void;
}

export const useProviderStore = create<ProviderState>((set) => ({
    providers: {},
    statuses: {},
    isLoading: false,

    setProviders: (providers) =>
        set({
            providers: Object.fromEntries(providers.map((p) => [p.id, p])),
        }),

    addProvider: (provider) =>
        set((state) => ({
            providers: { ...state.providers, [provider.id]: provider },
        })),

    updateProvider: (id, updates) =>
        set((state) => ({
            providers: {
                ...state.providers,
                [id]: { ...state.providers[id], ...updates },
            },
        })),

    removeProvider: (id) =>
        set((state) => {
            const { [id]: _, ...rest } = state.providers;
            const { [id]: __, ...restStatuses } = state.statuses;
            return { providers: rest, statuses: restStatuses };
        }),

    setStatus: (id, status) =>
        set((state) => ({
            statuses: { ...state.statuses, [id]: status },
        })),

    setLoading: (loading) => set({ isLoading: loading }),
}));
