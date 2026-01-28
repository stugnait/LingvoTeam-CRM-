// /components/kanban/SortableTask.tsx
'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, User } from 'lucide-react';
import { KanbanTask } from '../../types';
import { cn } from '@/src/lib/utils';

interface SortableTaskProps {
    task: KanbanTask;
}

const SortableTask: React.FC<SortableTaskProps> = React.memo(({ task }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: task.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transition || 'transform 150ms ease'
    };

    const priorityColors = {
        low: 'bg-green-500/10 text-green-600',
        medium: 'bg-blue-500/10 text-blue-600',
        high: 'bg-yellow-500/10 text-yellow-600',
        critical: 'bg-red-500/10 text-red-600'
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
                "touch-manipulation",
                isDragging && "opacity-30"
            )}
        >
            <div
                className={cn(
                    "relative p-3 rounded-lg border bg-white dark:bg-gray-800 shadow-sm",
                    "transition-all duration-150",
                    "hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500",
                    "cursor-grab active:cursor-grabbing",
                    "select-none"
                )}
            >
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={cn(
                            "w-2 h-2 rounded-full flex-shrink-0",
                            task.priority === 'critical' ? 'bg-red-500' :
                                task.priority === 'high' ? 'bg-yellow-500' :
                                    task.priority === 'medium' ? 'bg-blue-500' : 'bg-green-500'
                        )} />
                        <h3 className="font-medium text-sm line-clamp-2 flex-1">
                            {task.title}
                        </h3>
                    </div>
                    <span className={cn(
                        "text-xs font-medium px-2 py-1 rounded flex-shrink-0",
                        priorityColors[task.priority]
                    )}>
                        {task.priority.charAt(0).toUpperCase()}
                    </span>
                </div>

                {task.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                        {task.description}
                    </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        {task.assignee ? (
                            <>
                                {task.assignee.avatar ? (
                                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center overflow-hidden">
                                        <img
                                            src={task.assignee.avatar}
                                            alt={task.assignee.name}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                        <User className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                    </div>
                                )}
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {task.assignee.name.split(' ')[0]}
                                </span>
                            </>
                        ) : (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                Unassigned
                            </div>
                        )}
                    </div>

                    {task.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

SortableTask.displayName = 'SortableTask';

export default SortableTask;