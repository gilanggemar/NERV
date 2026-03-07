'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/store/useThemeStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { theme, setTheme } = useThemeStore();

    useEffect(() => {
        // Apply on mount
        setTheme(theme);

        // Listen for system preference changes
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => {
            const currentTheme = useThemeStore.getState().theme;
            if (currentTheme === 'system') {
                setTheme('system');
            }
        };
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [setTheme]); // Removed theme from dependency array to avoid setting it constantly

    return <>{children}</>;
}
