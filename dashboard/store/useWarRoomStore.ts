import { create } from 'zustand';
import type { WarRoomSession, WarRoomEvent } from '@/lib/war-room/types';

interface WarRoomState {
    sessions: WarRoomSession[];
    activeSessionId: string | null;
    events: WarRoomEvent[];
    isLoading: boolean;

    fetchSessions: () => Promise<void>;
    setActiveSession: (id: string | null) => void;
    fetchEvents: (sessionId: string) => Promise<void>;
    createEvent: (sessionId: string, type: string, content: string, agentId?: string, metadata?: any) => Promise<void>;
}

export const useWarRoomStore = create<WarRoomState>((set, get) => ({
    sessions: [],
    activeSessionId: null,
    events: [],
    isLoading: false,

    fetchSessions: async () => {
        set({ isLoading: true });
        try {
            const res = await fetch('/api/war-room');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) set({ sessions: data });
            }
        } catch (e) {
            console.error('Failed to fetch war room sessions:', e);
        } finally {
            set({ isLoading: false });
        }
    },

    setActiveSession: (id) => {
        set({ activeSessionId: id, events: [] });
        if (id) get().fetchEvents(id);
    },

    fetchEvents: async (sessionId) => {
        try {
            const res = await fetch(`/api/war-room/${sessionId}/events`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) set({ events: data });
            }
        } catch (e) {
            console.error('Failed to fetch war room events:', e);
        }
    },

    createEvent: async (sessionId, type, content, agentId, metadata = {}) => {
        try {
            const res = await fetch(`/api/war-room/${sessionId}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, content, agentId, metadata }),
            });
            if (res.ok) {
                get().fetchEvents(sessionId);
            }
        } catch (e) {
            console.error('Failed to create event:', e);
        }
    },
}));
