import { create } from 'zustand';
import type { Notification, AlertRule } from '@/lib/notifications/types';

interface NotificationState {
    notifications: Notification[];
    alertRules: AlertRule[];
    unreadCount: number;
    isLoading: boolean;

    fetchNotifications: () => Promise<void>;
    fetchAlertRules: () => Promise<void>;
    markRead: (id: number) => Promise<void>;
    markAllRead: () => Promise<void>;
    deleteNotification: (id: number) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],
    alertRules: [],
    unreadCount: 0,
    isLoading: false,

    fetchNotifications: async () => {
        set({ isLoading: true });
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                set({
                    notifications: Array.isArray(data?.notifications) ? data.notifications : [],
                    unreadCount: data?.unreadCount || 0,
                });
            }
        } catch (e) {
            console.error('Failed:', e);
        } finally {
            set({ isLoading: false });
        }
    },

    fetchAlertRules: async () => {
        try {
            const res = await fetch('/api/alerts');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) set({ alertRules: data });
            }
        } catch (e) {
            console.error('Failed:', e);
        }
    },

    markRead: async (id) => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            set((s) => ({
                notifications: s.notifications.map((n) => n.id === id ? { ...n, isRead: true } : n),
                unreadCount: Math.max(0, s.unreadCount - 1),
            }));
        } catch (e) {
            console.error('Failed:', e);
        }
    },

    markAllRead: async () => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ all: true }),
            });
            set((s) => ({
                notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
                unreadCount: 0,
            }));
        } catch (e) {
            console.error('Failed:', e);
        }
    },

    deleteNotification: async (id) => {
        try {
            await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
            set((s) => ({
                notifications: s.notifications.filter((n) => n.id !== id),
                unreadCount: s.notifications.find((n) => n.id === id && !n.isRead) ? s.unreadCount - 1 : s.unreadCount,
            }));
        } catch (e) {
            console.error('Failed:', e);
        }
    },
}));
