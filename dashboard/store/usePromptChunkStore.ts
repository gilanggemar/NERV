import { create } from 'zustand';
import { toast } from 'sonner';

export interface PromptChunk {
    id: string;
    name: string;
    content: string;
    color: string;
    category: string;
    order: number;
    createdAt: string;
    updatedAt: string;
}

interface PromptChunkStore {
    chunks: PromptChunk[];
    isLoading: boolean;

    // CRUD Actions
    fetchChunks: () => Promise<void>;
    createChunk: (chunk: Omit<PromptChunk, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => Promise<void>;
    updateChunk: (id: string, updates: Partial<PromptChunk>) => Promise<void>;
    deleteChunk: (id: string) => Promise<void>;
    reorderChunks: (orderedIds: string[]) => void;

    // Dialog state
    dialogOpen: boolean;
    editingChunk: PromptChunk | null;
    openCreateDialog: () => void;
    openEditDialog: (chunk: PromptChunk) => void;
    closeDialog: () => void;
}

export const usePromptChunkStore = create<PromptChunkStore>((set, get) => ({
    chunks: [],
    isLoading: false,

    fetchChunks: async () => {
        set({ isLoading: true });
        try {
            const res = await fetch('/api/prompt-chunks');
            if (!res.ok) throw new Error('Failed to fetch prompt chunks');
            const data = await res.json();
            set({ chunks: data.chunks || [] });
        } catch (error) {
            console.error(error);
            toast.error('Failed to load prompt chunks');
        } finally {
            set({ isLoading: false });
        }
    },

    createChunk: async (chunkData) => {
        try {
            const res = await fetch('/api/prompt-chunks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(chunkData),
            });
            if (!res.ok) throw new Error('Failed to create chunk');
            const data = await res.json();
            set((state) => ({ chunks: [...state.chunks, data.chunk] }));
            toast.success('Chunk created');
            get().closeDialog();
        } catch (error) {
            console.error(error);
            toast.error('Failed to create prompt chunk');
        }
    },

    updateChunk: async (id, updates) => {
        try {
            const res = await fetch(`/api/prompt-chunks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (!res.ok) throw new Error('Failed to update chunk');
            const data = await res.json();
            set((state) => ({
                chunks: state.chunks.map((c) => (c.id === id ? data.chunk : c)),
            }));
            toast.success('Chunk updated');
            get().closeDialog();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update prompt chunk');
        }
    },

    deleteChunk: async (id) => {
        try {
            const res = await fetch(`/api/prompt-chunks/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete chunk');
            set((state) => ({
                chunks: state.chunks.filter((c) => c.id !== id),
            }));
            toast.success('Chunk deleted');
            get().closeDialog();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete prompt chunk');
        }
    },

    reorderChunks: (orderedIds) => {
        set((state) => {
            const chunksMap = new Map(state.chunks.map((c) => [c.id, c]));
            const newChunks = orderedIds.map((id, index) => {
                const chunk = chunksMap.get(id)!;
                return { ...chunk, order: index };
            });
            return { chunks: newChunks };
        });
        // API sync left out for now as optional
    },

    dialogOpen: false,
    editingChunk: null,

    openCreateDialog: () => set({ dialogOpen: true, editingChunk: null }),

    openEditDialog: (chunk) => set({ dialogOpen: true, editingChunk: chunk }),

    closeDialog: () => set({ dialogOpen: false, editingChunk: null }),
}));
