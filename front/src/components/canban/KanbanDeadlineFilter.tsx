'use client';

import React, { useMemo } from 'react';
import { AlertCircle, Clock, CalendarDays, Calendar, Ban, ChevronDown } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export type DeadlineFilter = 'all' | 'overdue' | 'today' | 'this_week' | 'no_deadline';

interface DeadlineFilterBarProps {
    active: DeadlineFilter;
    onChange: (filter: DeadlineFilter) => void;
    tasks?: { deadline?: string }[];  // додай ?
}

interface FilterPreset {
    id: DeadlineFilter;
    label: string;
    icon: React.ReactNode;
    color: string;
    activeClass: string;
    countFn: (tasks: { deadline?: string }[]) => number;
}

const PRESETS: FilterPreset[] = [
    {
        id: 'all',
        label: 'All',
        icon: <CalendarDays className="w-3.5 h-3.5" />,
        color: 'text-gray-500',
        activeClass: 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-gray-900 dark:border-white',
        countFn: (tasks) => tasks.length,
    },
    {
        id: 'overdue',
        label: 'Overdue',
        icon: <AlertCircle className="w-3.5 h-3.5" />,
        color: 'text-red-500',
        activeClass: 'bg-red-500 text-white border-red-500',
        countFn: (tasks) => {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            return tasks.filter(t => t.deadline && new Date(t.deadline) < now).length;
        },
    },
    {
        id: 'today',
        label: 'Today',
        icon: <Clock className="w-3.5 h-3.5" />,
        color: 'text-orange-500',
        activeClass: 'bg-orange-500 text-white border-orange-500',
        countFn: (tasks) => {
            const now = new Date();
            return tasks.filter(t => {
                if (!t.deadline) return false;
                const d = new Date(t.deadline);
                return (
                    d.getDate() === now.getDate() &&
                    d.getMonth() === now.getMonth() &&
                    d.getFullYear() === now.getFullYear()
                );
            }).length;
        },
    },
    {
        id: 'this_week',
        label: 'This week',
        icon: <Calendar className="w-3.5 h-3.5" />,
        color: 'text-blue-500',
        activeClass: 'bg-blue-500 text-white border-blue-500',
        countFn: (tasks) => {
            const now = new Date();
            const weekEnd = new Date(now);
            weekEnd.setDate(now.getDate() + 7);
            now.setHours(0, 0, 0, 0);
            return tasks.filter(t => {
                if (!t.deadline) return false;
                const d = new Date(t.deadline);
                return d >= now && d <= weekEnd;
            }).length;
        },
    },
    {
        id: 'no_deadline',
        label: 'No deadline',
        icon: <Ban className="w-3.5 h-3.5" />,
        color: 'text-gray-400',
        activeClass: 'bg-gray-500 text-white border-gray-500',
        countFn: (tasks) => tasks.filter(t => !t.deadline).length,
    },
];

export function KanbanDeadlineFilter({ active, onChange, tasks = [] }: DeadlineFilterBarProps) {
    const counts = useMemo(
        () => Object.fromEntries(PRESETS.map(p => [p.id, p.countFn(tasks)])),
        [tasks]
    );

    return (
        <div className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-6 py-2 sm:py-2.5 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm overflow-x-auto scrollbar-none">
            <span className="text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wider mr-1 whitespace-nowrap flex-shrink-0">
                Deadline
            </span>

            {PRESETS.map((preset) => {
                const isActive = active === preset.id;
                const count = counts[preset.id];

                return (
                    <button
                        key={preset.id}
                        onClick={() => onChange(preset.id)}
                        className={cn(
                            "inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium border transition-all duration-150 whitespace-nowrap flex-shrink-0",
                            isActive
                                ? preset.activeClass
                                : cn(
                                    "bg-transparent border-gray-200 dark:border-gray-700",
                                    "text-gray-600 dark:text-gray-400",
                                    "hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-white"
                                )
                        )}
                    >
                        <span className={isActive ? '' : preset.color}>
                            {preset.icon}
                        </span>
                        <span className="hidden xs:inline sm:inline">{preset.label}</span>
                        <span className="xs:hidden sm:hidden">{preset.label.split(' ')[0]}</span>
                        {count > 0 && (
                            <span className={cn(
                                "inline-flex items-center justify-center rounded-full text-[10px] font-bold min-w-[14px] sm:min-w-[16px] h-3.5 sm:h-4 px-1",
                                isActive
                                    ? "bg-white/20 text-white"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                            )}>
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

/**
 * Утиліта для фільтрації тасок по обраному пресету.
 * Використовуй у батьківському компоненті:
 *
 *   const filtered = filterTasksByDeadline(allTasks, activeDeadlineFilter)
 */
export function filterTasksByDeadline<T extends { deadline?: string }>(
    tasks: T[],
    filter: DeadlineFilter
): T[] {
    if (filter === 'all') return tasks;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    switch (filter) {
        case 'overdue':
            return tasks.filter(t => t.deadline && new Date(t.deadline) < now);

        case 'today': {
            const today = new Date();
            return tasks.filter(t => {
                if (!t.deadline) return false;
                const d = new Date(t.deadline);
                return (
                    d.getDate() === today.getDate() &&
                    d.getMonth() === today.getMonth() &&
                    d.getFullYear() === today.getFullYear()
                );
            });
        }

        case 'this_week': {
            const weekEnd = new Date(now);
            weekEnd.setDate(now.getDate() + 7);
            return tasks.filter(t => {
                if (!t.deadline) return false;
                const d = new Date(t.deadline);
                return d >= now && d <= weekEnd;
            });
        }

        case 'no_deadline':
            return tasks.filter(t => !t.deadline);

        default:
            return tasks;
    }
}