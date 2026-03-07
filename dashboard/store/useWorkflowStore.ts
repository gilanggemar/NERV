import { create } from 'zustand';
import type { Workflow, WorkflowRun } from '@/lib/workflows/types';

interface WorkflowState {
    workflows: Workflow[];
    runs: WorkflowRun[];
    activeWorkflowId: string | null;
    isLoading: boolean;

    setWorkflows: (wfs: Workflow[]) => void;
    setRuns: (runs: WorkflowRun[]) => void;
    setActiveWorkflow: (id: string | null) => void;
    setLoading: (loading: boolean) => void;

    fetchWorkflows: () => Promise<void>;
    fetchRuns: (workflowId?: string) => Promise<void>;
    triggerRun: (workflowId: string) => Promise<void>;
    deleteRun: (runId: string) => Promise<void>;
    cancelRun: (runId: string) => Promise<void>;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
    workflows: [],
    runs: [],
    activeWorkflowId: null,
    isLoading: false,

    setWorkflows: (workflows) => set({ workflows }),
    setRuns: (runs) => set({ runs }),
    setActiveWorkflow: (id) => set({ activeWorkflowId: id }),
    setLoading: (loading) => set({ isLoading: loading }),

    fetchWorkflows: async () => {
        set({ isLoading: true });
        try {
            const res = await fetch('/api/workflows');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) set({ workflows: data });
            }
        } catch (e) {
            console.error('Failed to fetch workflows:', e);
        } finally {
            set({ isLoading: false });
        }
    },

    fetchRuns: async (workflowId) => {
        try {
            const params = workflowId ? `?workflowId=${workflowId}` : '';
            const res = await fetch(`/api/workflows/runs${params}`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) set({ runs: data });
            }
        } catch (e) {
            console.error('Failed to fetch runs:', e);
        }
    },

    triggerRun: async (workflowId) => {
        try {
            await fetch(`/api/workflows/${workflowId}/run`, { method: 'POST' });
        } catch (e) {
            console.error('Failed to trigger run:', e);
        }
    },

    deleteRun: async (runId) => {
        try {
            const res = await fetch(`/api/workflows/runs/${runId}`, { method: 'DELETE' });
            if (res.ok) {
                // Remove from local state immediately for snappy UI
                set((state) => ({ runs: state.runs.filter(r => r.id !== runId) }));
            }
        } catch (e) {
            console.error('Failed to delete run:', e);
        }
    },

    cancelRun: async (runId) => {
        try {
            const res = await fetch(`/api/workflows/runs/${runId}/cancel`, { method: 'POST' });
            if (res.ok) {
                // Update local status for snappy UI
                set((state) => ({
                    runs: state.runs.map(r =>
                        r.id === runId ? { ...r, status: 'cancelled' as const, completedAt: Date.now() } : r
                    )
                }));
            }
        } catch (e) {
            console.error('Failed to cancel run:', e);
        }
    }
}));

