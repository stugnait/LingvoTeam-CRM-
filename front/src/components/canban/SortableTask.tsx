'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, User, Hash, Globe } from 'lucide-react';
import { cn } from '@/src/lib/utils';

type TaskStatus = 'planned' | 'todo' | 'in_progress' | 'reject' | 'pause' | 'done';
type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface KanbanTask {
    id: string
    title: string
    description?: string
    status: TaskStatus
    status_id: number
    priority: TaskPriority
    deadline?: string
    client_name: string
    avatar_url?: string | null
    intake_manager?: { name: string; avatar?: string } | null
    delivery_manager?: { name: string; avatar?: string } | null
    tags: string[]
    subtasks: any[]
}

interface SortableTaskProps {
    task: KanbanTask
    onClick: () => void
}

const Avatar = ({ name, avatar, color }: { name: string; avatar?: string; color: 'blue' | 'purple' }) => (
    <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0",
        color === 'blue' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-purple-100 dark:bg-purple-900'
    )}>
        {avatar ? (
            <img src={avatar} alt={name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
            <span className={cn("text-[10px] font-semibold", color === 'blue' ? 'text-blue-600' : 'text-purple-600')}>
                {name?.charAt(0)?.toUpperCase() || '?'}
            </span>
        )}
    </div>
)

const SortableTask: React.FC<SortableTaskProps> = React.memo(({ task, onClick }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id.toString(),
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
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}
             className={cn("touch-manipulation", isDragging && "opacity-30")}
        >
            <div
                className={cn(
                    "relative p-3 rounded-lg border bg-white dark:bg-gray-800 shadow-sm",
                    "transition-all duration-150",
                    "hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500",
                    "cursor-grab active:cursor-grabbing select-none"
                )}
                onClick={(e) => { e.stopPropagation(); onClick(); }}
            >
                {/* Title row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={cn(
                            "w-2 h-2 rounded-full flex-shrink-0",
                            task.priority === 'critical' ? 'bg-red-500' :
                                task.priority === 'high' ? 'bg-yellow-500' :
                                    task.priority === 'medium' ? 'bg-blue-500' : 'bg-green-500'
                        )}/>
                        <h3 className="font-medium text-sm line-clamp-2">{task.title}</h3>
                    </div>
                    <span className={cn("text-xs font-medium px-2 py-1 rounded flex-shrink-0", priorityColors[task.priority])}>
                        {task.priority.charAt(0).toUpperCase()}
                    </span>
                </div>

                {/* ID + deadline row */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                        <Hash className="w-3 h-3 text-gray-400"/>
                        <span className="text-xs text-gray-500">#{task.id}</span>
                    </div>
                    {task.deadline && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <Calendar className="w-3 h-3"/>
                            {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                    )}
                </div>

                {/*{task.description && (*/}
                {/*    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">*/}
                {/*        {task.description}*/}
                {/*    </p>*/}
                {/*)}*/}

                {/* Client + pair */}
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1 min-w-0">
                        <span className="font-medium">Client:</span>
                        <span className="truncate" title={task.client_name}>{task.client_name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Globe className="w-3 h-3"/>
                        <span>Pair: {(task as any).language_pair_id || 'N/A'}</span>
                    </div>
                </div>

                {/* Managers */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                    {/* Менеджер прийому */}
                    <div className="flex items-center gap-1.5 min-w-0">
                        <Avatar name={task.intake_manager?.name || ''} avatar={task.intake_manager?.avatar} color="blue" />
                        <div className="min-w-0">
                            <div className="text-[10px] text-gray-400 leading-none mb-0.5">Прийом</div>
                            <div className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[60px]">
                                {task.intake_manager?.name?.split(' ')[0] || '—'}
                            </div>
                        </div>
                    </div>

                    <div className="w-px h-8 bg-gray-100 dark:bg-gray-700"/>

                    {/* Менеджер здачі */}
                    <div className="flex items-center gap-1.5 min-w-0">
                        <Avatar name={task.delivery_manager?.name || ''} avatar={task.delivery_manager?.avatar} color="purple" />
                        <div className="min-w-0">
                            <div className="text-[10px] text-gray-400 leading-none mb-0.5">Здача</div>
                            <div className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[60px]">
                                {task.delivery_manager?.name?.split(' ')[0] || '—'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

SortableTask.displayName = 'SortableTask';
export default SortableTask;