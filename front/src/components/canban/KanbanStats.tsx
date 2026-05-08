// /components/kanban/KanbanStats.tsx
'use client';

import React from 'react';

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
    getTasksForColumn: (column: KanbanColumn) => any[];
}

const KanbanStats: React.FC<KanbanStatsProps> = ({
                                                     columns,
                                                     getTasksForColumn
                                                 }) => {
    return (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-6 py-3 shadow-xl backdrop-blur-sm">
                {columns.map((column) => {
                    const tasks = getTasksForColumn(column);
                    return (
                        <div key={column.id} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: column.color }}
                            />
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {column.title}: {tasks.length}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default KanbanStats;