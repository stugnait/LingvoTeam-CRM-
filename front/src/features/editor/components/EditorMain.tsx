// /app/EditorMain.tsx
'use client';

import React from 'react';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
    MeasuringStrategy,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

// Components
import KanbanHeader from '@/src/features/editor/components/canban/KanbanHeader';
import KanbanColumn from '@/src/features/editor/components/canban/KanbanColumn';
import KanbanStats from '@/src/features/editor/components/canban/KanbanStats';

// Hooks and types
import { useEditor } from '../hooks/useEditor';
import { KanbanTask } from '../types';
import { cn } from '@/src/lib/utils';

// Icons for columns
import {
    Target,
    Clock,
    Eye,
    XCircle,
    PauseCircle,
    CheckSquare
} from 'lucide-react';

// Map column status to icons
const COLUMN_ICONS = {
    planned: <Target className="w-4 h-4" />,
    todo: <Clock className="w-4 h-4" />,
    in_progress: <Eye className="w-4 h-4" />,
    reject: <XCircle className="w-4 h-4" />,
    pause: <PauseCircle className="w-4 h-4" />,
    done: <CheckSquare className="w-4 h-4" />,
};

export default function EditorMain() {
    const {
        tasks,
        columns,
        activeTask,
        searchQuery,
        setSearchQuery,
        setActiveTask,
        tasksMap,
        handleDragStart,
        handleDragEnd,
        handleAddTask,
        getTasksForColumn,
    } = useEditor();

    // Sensors for DnD
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 0,
            }
        })
    );

    // Add icons to columns
    const columnsWithIcons = columns.map(col => ({
        ...col,
        icon: COLUMN_ICONS[col.status as keyof typeof COLUMN_ICONS]
    }));

    // DnD event handlers
    const onDragStart = (event: DragStartEvent) => {
        const taskId = event.active.id as string;
        handleDragStart(taskId);
    };

    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        handleDragEnd(
            active.id as string,
            over?.id as string | null
        );
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            {/* Header */}
            <KanbanHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />

            {/* Main Content */}
            <div className="p-6">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    measuring={{
                        droppable: {
                            strategy: MeasuringStrategy.Always
                        }
                    }}
                >
                    <div className="flex gap-6 overflow-x-auto pb-6 -mx-6 px-6">
                        {columnsWithIcons.map((column) => {
                            const columnTasks = getTasksForColumn(column);

                            return (
                                <KanbanColumn
                                    key={column.id}
                                    column={column}
                                    tasks={columnTasks}
                                    onAddTask={() => handleAddTask(column.id)}
                                />
                            );
                        })}
                    </div>

                    {/* Drag Overlay */}
                    <DragOverlay>
                        {activeTask && (
                            <div className="shadow-2xl rounded-lg border-2 border-blue-500 bg-white dark:bg-gray-800 rotate-2 opacity-90">
                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            activeTask.priority === 'critical' ? 'bg-red-500' :
                                                activeTask.priority === 'high' ? 'bg-yellow-500' :
                                                    activeTask.priority === 'medium' ? 'bg-blue-500' : 'bg-green-500'
                                        )} />
                                        <h3 className="font-medium text-sm text-gray-900 dark:text-white">
                                            {activeTask.title}
                                        </h3>
                                    </div>
                                    {activeTask.assignee && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {activeTask.assignee.name}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* Stats Bar */}
            <KanbanStats
                columns={columnsWithIcons}
                getTasksForColumn={getTasksForColumn}
            />
        </div>
    );
}