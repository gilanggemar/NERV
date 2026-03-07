// ─── Workflow Scheduler ──────────────────────────────────────────────────────

import type { ScheduleConfig } from './types';

/**
 * Parse a simple cron expression and determine if it should run now.
 * Supports: minute hour dayOfMonth month dayOfWeek
 * Uses * as wildcard, supports ranges (1-5).
 */
export function shouldRunNow(schedule: ScheduleConfig): boolean {
    if (schedule.type === 'manual') return false;

    if (schedule.type === 'interval' && schedule.intervalMs) {
        // Interval-based: handled externally by checking lastRunAt
        return true;
    }

    if (schedule.type === 'cron' && schedule.cronExpr) {
        return matchesCron(schedule.cronExpr, new Date());
    }

    return false;
}

/**
 * Simple cron matcher (minute hour dayOfMonth month dayOfWeek).
 */
function matchesCron(expr: string, date: Date): boolean {
    const parts = expr.trim().split(/\s+/);
    if (parts.length !== 5) return false;

    const [minPart, hourPart, domPart, monthPart, dowPart] = parts;
    const minute = date.getMinutes();
    const hour = date.getHours();
    const dom = date.getDate();
    const month = date.getMonth() + 1;
    const dow = date.getDay(); // 0=Sun

    return (
        matchCronField(minPart, minute) &&
        matchCronField(hourPart, hour) &&
        matchCronField(domPart, dom) &&
        matchCronField(monthPart, month) &&
        matchCronField(dowPart, dow)
    );
}

function matchCronField(field: string, value: number): boolean {
    if (field === '*') return true;

    // Handle comma-separated values
    const parts = field.split(',');
    for (const part of parts) {
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(Number);
            if (value >= start && value <= end) return true;
        } else if (part.includes('/')) {
            const [, step] = part.split('/').map(Number);
            if (value % step === 0) return true;
        } else {
            if (parseInt(part) === value) return true;
        }
    }

    return false;
}

/**
 * Get a human-readable description of a schedule.
 */
export function describeSchedule(schedule: ScheduleConfig): string {
    if (schedule.type === 'manual') return 'Manual trigger';
    if (schedule.type === 'interval' && schedule.intervalMs) {
        const mins = Math.round(schedule.intervalMs / 60000);
        if (mins < 60) return `Every ${mins} min`;
        const hrs = Math.round(mins / 60);
        if (hrs < 24) return `Every ${hrs}h`;
        return `Every ${Math.round(hrs / 24)}d`;
    }
    if (schedule.type === 'cron' && schedule.cronExpr) {
        return `Cron: ${schedule.cronExpr}`;
    }
    return 'Unknown';
}
