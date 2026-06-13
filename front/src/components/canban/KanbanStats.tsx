// /components/kanban/KanbanStats.tsx
'use client';

import React from 'react';
import { useI18n } from '@/src/shared/i18n/I18nProvider';

type TaskStatus = 'planned' | 'todo' | 'in_progress' | 'reject' | 'pause' | 'done';

interface KanbanColumn {
    id: string;
    title: string;
    status: TaskStatus;
    status_id: string; // '1', '2', '3', '4', '5', '6'
    taskIds: string[];
    color: string;
    icon: React.ReactNode;
}

interface KanbanStatsProps {
    columns: KanbanColumn[];
    getTasksForColumn: (column: KanbanColumn) => unknown[];
}

const KanbanStats: React.FC<KanbanStatsProps> = ({
                                                     columns,
                                                     getTasksForColumn
                                                 }) => {
    const { t } = useI18n()

    return (
        <div className="fixed bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 w-[calc(100vw-32px)] sm:w-auto max-w-full">
            <div className="flex items-center gap-3 sm:gap-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-3 sm:px-6 py-2 sm:py-3 shadow-xl backdrop-blur-sm overflow-x-auto scrollbar-none">
                {columns.map((column) => {
                    const tasks = getTasksForColumn(column);
                    return (
                        <div key={column.id} className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                            <div
                                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
                                style={{ backgroundColor: column.color }}
                            />
                            <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                                {t(column.title)}: {tasks.length}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default KanbanStats;
