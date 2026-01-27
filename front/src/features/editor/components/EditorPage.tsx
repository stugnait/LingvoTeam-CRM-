// app/EditorMain.tsx
'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
    DragOverEvent,
    useDroppable
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove
} from '@dnd-kit/sortable';
import {
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Plus,
    Search,
    Calendar,
    User,
    Clock,
    Eye,
    CheckCircle,
    CheckSquare
} from 'lucide-react';

// =========================
// TYPES
// =========================

type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

interface KanbanTask {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignee?: {
        id: string;
        name: string;
        avatar?: string;
    };
    tags: string[];
    dueDate?: Date;
}

interface KanbanColumn {
    id: string;
    title: string;
    status: TaskStatus;
    taskIds: string[];
    color: string;
    icon: React.ReactNode;
}

// =========================
// UTILITY FUNCTIONS
// =========================

function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}

const initialTasks: KanbanTask[] = [
    {
        id: 'task-1',
        title: 'Design new dashboard layout',
        description: 'Create wireframes and mockups',
        status: 'todo',
        priority: 'high',
        assignee: {
            id: 'user-1',
            name: 'Alex Johnson',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
        },
        tags: ['Design', 'UI/UX'],
        dueDate: new Date('2024-12-20')
    },
    {
        id: 'task-2',
        title: 'Implement user authentication',
        description: 'Add login, registration',
        status: 'in_progress',
        priority: 'critical',
        assignee: {
            id: 'user-2',
            name: 'Maria Garcia',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria'
        },
        tags: ['Backend', 'Security'],
        dueDate: new Date('2024-12-15')
    },
    {
        id: 'task-3',
        title: 'Fix mobile responsive issues',
        description: 'Address layout problems',
        status: 'todo',
        priority: 'medium',
        assignee: {
            id: 'user-3',
            name: 'David Chen',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David'
        },
        tags: ['Frontend', 'Responsive'],
        dueDate: new Date('2024-12-10')
    },
    {
        id: 'task-4',
        title: 'Write API documentation',
        description: 'Document all endpoints',
        status: 'in_review',
        priority: 'medium',
        assignee: {
            id: 'user-4',
            name: 'Sarah Wilson',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
        },
        tags: ['Documentation', 'API'],
        dueDate: new Date('2024-12-12')
    },
    {
        id: 'task-5',
        title: 'Optimize database queries',
        description: 'Improve performance',
        status: 'done',
        priority: 'high',
        assignee: {
            id: 'user-5',
            name: 'Michael Brown',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael'
        },
        tags: ['Database', 'Performance'],
        dueDate: new Date('2024-12-05')
    }
];

const initialColumns: KanbanColumn[] = [
    {
        id: 'todo',
        title: 'To Do',
        status: 'todo',
        taskIds: ['task-1', 'task-3'],
        color: '#6366f1',
        icon: <Clock className="w-4 h-4" />
    },
    {
        id: 'in_progress',
        title: 'In Progress',
        status: 'in_progress',
        taskIds: ['task-2'],
        color: '#f59e0b',
        icon: <Eye className="w-4 h-4" />
    },
    {
        id: 'in_review',
        title: 'In Review',
        status: 'in_review',
        taskIds: ['task-4'],
        color: '#8b5cf6',
        icon: <CheckCircle className="w-4 h-4" />
    },
    {
        id: 'done',
        title: 'Done',
        status: 'done',
        taskIds: ['task-5'],
        color: '#10b981',
        icon: <CheckSquare className="w-4 h-4" />
    }
];

// =========================
// COMPONENTS
// =========================

const SortableTask = React.memo(function SortableTask({ task }: { task: KanbanTask }) {
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

const ColumnDropZone = ({ columnId }: { columnId: string }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `dropzone-${columnId}`,
        data: {
            type: 'column',
            columnId
        }
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "min-h-[80px] rounded-lg border-2 border-dashed transition-all duration-200 my-2",
                isOver
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500"
            )}
        >
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
                    <Plus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Drop tasks here</p>
            </div>
        </div>
    );
};

const KanbanColumn = React.memo(function KanbanColumn({
                                                          column,
                                                          tasks,
                                                          onAddTask
                                                      }: {
    column: KanbanColumn;
    tasks: KanbanTask[];
    onAddTask?: () => void;
}) {
    const taskIds = useMemo(() => tasks.map(t => t.id), [tasks]);

    return (
        <div className="flex flex-col h-full w-[280px] flex-shrink-0 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${column.color}15` }}
                    >
                        <div style={{ color: column.color }}>
                            {column.icon}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                            {column.title}
                        </h3>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                        </div>
                    </div>
                </div>

                <button
                    onClick={onAddTask}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Add task"
                >
                    <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
            </div>

            <div className="flex-1 p-3 space-y-3 overflow-y-auto min-h-[200px] max-h-[calc(100vh-220px)]">
                <SortableContext
                    items={taskIds}
                    strategy={verticalListSortingStrategy}
                >
                    {tasks.map((task) => (
                        <SortableTask key={task.id} task={task} />
                    ))}
                </SortableContext>

                {/* Дроп-зона для порожніх колонок */}
                {tasks.length === 0 && <ColumnDropZone columnId={column.id} />}

                <button
                    onClick={onAddTask}
                    className={cn(
                        "w-full py-3 rounded-lg border border-dashed",
                        "flex items-center justify-center gap-2 text-sm",
                        "text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700",
                        "hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400",
                        "hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                    )}
                >
                    <Plus className="w-4 h-4" />
                    Add task
                </button>
            </div>
        </div>
    );
});

// =========================
// MAIN COMPONENT
// =========================

export default function EditorMain() {
    const [tasks, setTasks] = useState<KanbanTask[]>(initialTasks);
    const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);
    const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Оптимізовані сенсори для плавного перетягування
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 0,
            }
        })
    );

    // Створюємо мапу задач для швидкого доступу
    const tasksMap = useMemo(() =>
            new Map(tasks.map(task => [task.id, task])),
        [tasks]
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const taskId = event.active.id as string;
        const task = tasksMap.get(taskId);
        if (task) {
            setActiveTask(task);
            // Оптимізація: приховуємо скролл
            document.body.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
        }
    }, [tasksMap]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);

        // Відновлюємо стилі
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Знаходимо початкову колонку
        const sourceColumn = columns.find(col =>
            col.taskIds.includes(activeId)
        );

        if (!sourceColumn) return;

        // Якщо перетягуємо на колонку (або дроп-зону)
        const isOverColumn = columns.some(col => col.id === overId) ||
            overId.startsWith('dropzone-');

        if (isOverColumn) {
            const targetColumnId = overId.startsWith('dropzone-')
                ? overId.replace('dropzone-', '')
                : overId;

            const targetColumn = columns.find(col => col.id === targetColumnId);

            if (!targetColumn || sourceColumn.id === targetColumn.id) return;

            // Оновлюємо статус задачі
            setTasks(prev => prev.map(task =>
                task.id === activeId
                    ? { ...task, status: targetColumn.status }
                    : task
            ));

            // Переміщуємо задачу між колонками
            setColumns(prev => prev.map(col => {
                if (col.id === sourceColumn.id) {
                    return {
                        ...col,
                        taskIds: col.taskIds.filter(id => id !== activeId)
                    };
                }
                if (col.id === targetColumn.id) {
                    return {
                        ...col,
                        taskIds: [...col.taskIds, activeId]
                    };
                }
                return col;
            }));

            return;
        }

        // Якщо перетягуємо на задачу
        const targetColumn = columns.find(col =>
            col.taskIds.includes(overId)
        );

        if (!targetColumn) return;

        // В межах однієї колонки
        if (sourceColumn.id === targetColumn.id) {
            const oldIndex = sourceColumn.taskIds.indexOf(activeId);
            const newIndex = targetColumn.taskIds.indexOf(overId);

            if (oldIndex !== newIndex && newIndex >= 0) {
                setColumns(prev =>
                    prev.map(col =>
                        col.id === sourceColumn.id
                            ? {
                                ...col,
                                taskIds: arrayMove(col.taskIds, oldIndex, newIndex)
                            }
                            : col
                    )
                );
            }
        }
        // Між колонками
        else {
            setTasks(prev => prev.map(task =>
                task.id === activeId
                    ? { ...task, status: targetColumn.status }
                    : task
            ));

            setColumns(prev => prev.map(col => {
                if (col.id === sourceColumn.id) {
                    return {
                        ...col,
                        taskIds: col.taskIds.filter(id => id !== activeId)
                    };
                }
                if (col.id === targetColumn.id) {
                    // Вставляємо на позицію після задачі, на яку перетягуємо
                    const overIndex = targetColumn.taskIds.indexOf(overId);
                    const newTaskIds = [...targetColumn.taskIds];
                    newTaskIds.splice(overIndex + 1, 0, activeId);

                    return {
                        ...col,
                        taskIds: newTaskIds
                    };
                }
                return col;
            }));
        }
    }, [columns, tasksMap]);

    const handleAddTask = useCallback((columnId: string) => {
        const column = columns.find(col => col.id === columnId);
        if (!column) return;

        const newTask: KanbanTask = {
            id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            title: 'New Task',
            description: 'Task description',
            status: column.status,
            priority: 'medium',
            tags: ['new'],
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Через 7 днів
        };

        setTasks(prev => [...prev, newTask]);
        setColumns(prev =>
            prev.map(col =>
                col.id === columnId
                    ? { ...col, taskIds: [...col.taskIds, newTask.id] }
                    : col
            )
        );
    }, [columns]);

    // Фільтруємо задачі для кожної колонки з пошуком
    const getTasksForColumn = useCallback((column: KanbanColumn) => {
        const columnTasks = column.taskIds
            .map(taskId => tasksMap.get(taskId))
            .filter(Boolean) as KanbanTask[];

        if (!searchQuery.trim()) return columnTasks;

        const query = searchQuery.toLowerCase();
        return columnTasks.filter(task =>
            task.title.toLowerCase().includes(query) ||
            task.description?.toLowerCase().includes(query) ||
            task.tags.some(tag => tag.toLowerCase().includes(query)) ||
            task.assignee?.name.toLowerCase().includes(query)
        );
    }, [tasksMap, searchQuery]);

    // Очистка при розмонтуванні
    useEffect(() => {
        return () => {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, []);

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur border-b border-gray-200 dark:border-gray-800">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Kanban Board
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Drag and drop to organize your tasks
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="search"
                                    placeholder="Search tasks..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm w-64 focus:w-80 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-6">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    measuring={{
                        droppable: {
                            strategy: MeasuringStrategy.Always
                        }
                    }}
                >
                    <div className="flex gap-6 overflow-x-auto pb-6 -mx-6 px-6">
                        {columns.map((column) => {
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
        </div>
    );
}