import { create } from 'zustand';
import type { AuditEntry } from '@/lib/telemetry/types';

interface AuditState {
    entries: AuditEntry[];
    total: number;
    isLoading: boolean;
    page: number;
    searchQuery: string;
    filterAgent: string;
    filterAction: string;

    setEntries: (entries: AuditEntry[], total: number) => void;
    setLoading: (loading: boolean) => void;
    setPage: (page: number) => void;
    setSearchQuery: (query: string) => void;
    setFilterAgent: (agent: string) => void;
    setFilterAction: (action: string) => void;

    /** Fetch audit logs from API */
    fetchLogs: () => Promise<void>;
}

export const useAuditStore = create<AuditState>((set, get) => ({
    entries: [],
    total: 0,
    isLoading: false,
    page: 0,
    searchQuery: '',
    filterAgent: 'all',
    filterAction: 'all',

    setEntries: (entries, total) => set({ entries, total }),
    setLoading: (loading) => set({ isLoading: loading }),
    setPage: (page) => set({ page }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setFilterAgent: (agent) => set({ filterAgent: agent }),
    setFilterAction: (action) => set({ filterAction: action }),

    fetchLogs: async () => {
        const { page, filterAgent, filterAction } = get();
        set({ isLoading: true });
        try {
            const params = new URLSearchParams();
            params.set('limit', '50');
            params.set('offset', String(page * 50));
            if (filterAgent && filterAgent !== 'all') params.set('agentId', filterAgent);
            if (filterAction && filterAction !== 'all') params.set('action', filterAction);

            const res = await fetch(`/api/audit?${params}`);
            if (res.ok) {
                const data = await res.json();
                const rows = Array.isArray(data?.rows) ? data.rows : [];
                set({ entries: rows, total: data?.total || 0 });
            }
        } catch (e) {
            console.error('Failed to fetch audit logs:', e);
        } finally {
            set({ isLoading: false });
        }
    },
}));
