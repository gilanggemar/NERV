import { create } from 'zustand';
import type { TelemetrySummary, ChartDataPoint } from '@/lib/telemetry/types';

interface TelemetryState {
    summary: TelemetrySummary | null;
    chartData: ChartDataPoint[];
    isLoading: boolean;
    lastFetched: number | null;

    setSummary: (summary: TelemetrySummary) => void;
    setChartData: (data: ChartDataPoint[]) => void;
    setLoading: (loading: boolean) => void;

    /** Fetch summary + chart data from API */
    fetchAll: () => Promise<void>;
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
    summary: null,
    chartData: [],
    isLoading: false,
    lastFetched: null,

    setSummary: (summary) => set({ summary }),
    setChartData: (data) => set({ chartData: data }),
    setLoading: (loading) => set({ isLoading: loading }),

    fetchAll: async () => {
        set({ isLoading: true });
        try {
            const [summaryRes, chartRes] = await Promise.all([
                fetch('/api/telemetry'),
                fetch('/api/telemetry/chart-data'),
            ]);
            if (summaryRes.ok) {
                const summary = await summaryRes.json();
                set({ summary });
            }
            if (chartRes.ok) {
                const chartData = await chartRes.json();
                // Only set if it's actually an array (API might return error object)
                if (Array.isArray(chartData)) {
                    set({ chartData });
                }
            }
            set({ lastFetched: Date.now() });
        } catch (e) {
            console.error('Failed to fetch telemetry:', e);
        } finally {
            set({ isLoading: false });
        }
    },
}));
