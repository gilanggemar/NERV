'use client';

import { useRef, useEffect, useMemo } from 'react';
import { eachDayOfInterval, addWeeks, addDays, format, isToday, isSaturday, isSunday, getDate } from 'date-fns';
import { DateColumn } from './DateColumn';
import { useSchedulerStore, type SchedulerEvent } from '@/store/useSchedulerStore';

// ─── Component ──────────────────────────────────────────────────────────────

export function CalendarTimeline() {
    const scrollRef = useRef<HTMLDivElement>(null);

    const {
        events, viewStartDate, viewRangeWeeks,
        selectedDate, dropTargetDate, filterAgentIds,
    } = useSchedulerStore();

    // Generate date array
    const dates = useMemo(() => {
        const end = addDays(addWeeks(viewStartDate, viewRangeWeeks), -1);
        return eachDayOfInterval({ start: viewStartDate, end });
    }, [viewStartDate, viewRangeWeeks]);

    // Group events by date (use virtualDate for recurring, scheduledDate for normal)
    const eventsByDate = useMemo(() => {
        const map: Record<string, SchedulerEvent[]> = {};
        for (const event of events) {
            // Apply agent filter
            if (filterAgentIds.length > 0 && !filterAgentIds.includes(event.agentId)) continue;

            const dateKey = event.virtualDate || event.scheduledDate;
            if (!map[dateKey]) map[dateKey] = [];
            map[dateKey].push(event);
        }
        return map;
    }, [events, filterAgentIds]);

    // Auto-scroll to today on mount
    useEffect(() => {
        if (!scrollRef.current) return;
        const todayIndex = dates.findIndex(d => isToday(d));
        if (todayIndex >= 0) {
            const targetX = todayIndex * 144; // w-36 = 144px
            scrollRef.current.scrollTo({ left: Math.max(0, targetX - 288), behavior: 'smooth' });
        }
    }, [dates]);

    return (
        <div
            ref={scrollRef}
            className="flex-1 overflow-x-auto overflow-y-hidden scroll-smooth"
        >
            <div className="flex h-full" style={{ width: `${dates.length * 144}px` }}>
                {dates.map((date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const dayEvents = eventsByDate[dateStr] || [];
                    const todayFlag = isToday(date);
                    const weekend = isSaturday(date) || isSunday(date);
                    const monthStart = getDate(date) === 1;

                    return (
                        <DateColumn
                            key={dateStr}
                            date={date}
                            dateStr={dateStr}
                            events={dayEvents}
                            isToday={todayFlag}
                            isWeekend={weekend}
                            isMonthStart={monthStart}
                            isSelected={selectedDate === dateStr}
                            isDropTarget={dropTargetDate === dateStr}
                        />
                    );
                })}
            </div>
        </div>
    );
}
