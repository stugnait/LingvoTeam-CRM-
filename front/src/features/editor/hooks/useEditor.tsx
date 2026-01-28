// /hooks/useEditor.ts
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { KanbanTask, KanbanColumn } from '../types';

// Initial data
const initialTasks: KanbanTask[] = [
    {
        id: 'task-1',
        title: 'Design new dashboard layout',
        description: 'Create wireframes and mockups',
        status: 'planned',
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
        status: 'in_progress',
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
    },
    {
        id: 'task-6',
        title: 'Fix critical security bug',
        description: 'Patch vulnerability in auth system',
        status: 'reject',
        priority: 'critical',
        assignee: {
            id: 'user-2',
            name: 'Maria Garcia',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria'
        },
        tags: ['Security', 'Bug'],
        dueDate: new Date('2024-12-01')
    },
    {
        id: 'task-7',
        title: 'Update user onboarding flow',
        description: 'Improve first-time user experience',
        status: 'pause',
        priority: 'medium',
        assignee: {
            id: 'user-1',
            name: 'Alex Johnson',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
        },
        tags: ['UX', 'Onboarding'],
        dueDate: new Date('2024-12-25')
    }
];

const initialColumns: KanbanColumn[] = [
    {
        id: 'planned',
        title: 'Planned',
        status: 'planned',
        taskIds: ['task-1'],
        color: '#8b5cf6',
        icon: null // Will be set in component
    },
    {
        id: 'todo',
        title: 'To Do',
        status: 'todo',
        taskIds: ['task-3'],
        color: '#6366f1',
        icon: null
    },
    {
        id: 'in_progress',
        title: 'In Progress',
        status: 'in_progress',
        taskIds: ['task-2', 'task-4'],
        color: '#f59e0b',
        icon: null
    },
    {
        id: 'reject',
        title: 'Reject',
        status: 'reject',
        taskIds: ['task-6'],
        color: '#ef4444',
        icon: null
    },
    {
        id: 'pause',
        title: 'Pause',
        status: 'pause',
        taskIds: ['task-7'],
        color: '#6b7280',
        icon: null
    },
    {
        id: 'done',
        title: 'Done',
        status: 'done',
        taskIds: ['task-5'],
        color: '#10b981',
        icon: null
    }
];

export const useEditor = () => {
    const [tasks, setTasks] = useState<KanbanTask[]>(initialTasks);
    const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);
    const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Create maps for fast access
    const tasksMap = useMemo(() =>
            new Map(tasks.map(task => [task.id, task])),
        [tasks]
    );

    const columnsMap = useMemo(() =>
            new Map(columns.map(col => [col.id, col])),
        [columns]
    );

    // Drag handlers
    const handleDragStart = useCallback((taskId: string) => {
        const task = tasksMap.get(taskId);
        if (task) {
            setActiveTask(task);
            // Optimizations for smooth dragging
            document.body.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
        }
    }, [tasksMap]);

    const handleDragEnd = useCallback((activeId: string, overId: string | null) => {
        setActiveTask(null);

        // Restore styles
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        if (!overId) return;

        const sourceColumn = columns.find(col => col.taskIds.includes(activeId));
        if (!sourceColumn) return;

        // Check if dragging to column or dropzone
        const isOverColumn = columns.some(col => col.id === overId) || overId.startsWith('dropzone-');

        if (isOverColumn) {
            const targetColumnId = overId.startsWith('dropzone-')
                ? overId.replace('dropzone-', '')
                : overId;

            const targetColumn = columns.find(col => col.id === targetColumnId);
            if (!targetColumn || sourceColumn.id === targetColumn.id) return;

            // Update task status
            setTasks(prev => prev.map(task =>
                task.id === activeId
                    ? { ...task, status: targetColumn.status }
                    : task
            ));

            // Move task between columns
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

        // Dragging to another task
        const targetColumn = columns.find(col => col.taskIds.includes(overId));
        if (!targetColumn) return;

        // Within same column
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
        // Between columns
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

    // Add new task
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
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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

    // Update task
    const handleUpdateTask = useCallback((taskId: string, updates: Partial<KanbanTask>) => {
        setTasks(prev => prev.map(task =>
            task.id === taskId ? { ...task, ...updates } : task
        ));
    }, []);

    // Delete task
    const handleDeleteTask = useCallback((taskId: string) => {
        setTasks(prev => prev.filter(task => task.id !== taskId));
        setColumns(prev => prev.map(col => ({
            ...col,
            taskIds: col.taskIds.filter(id => id !== taskId)
        })));
    }, []);

    // Filter tasks for column
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

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, []);

    return {
        // State
        tasks,
        columns,
        activeTask,
        searchQuery,

        // Setters
        setSearchQuery,
        setActiveTask,

        // Maps
        tasksMap,
        columnsMap,

        // Handlers
        handleDragStart,
        handleDragEnd,
        handleAddTask,
        handleUpdateTask,
        handleDeleteTask,
        getTasksForColumn,
    };
};

// Helper function for array moves (needs to be imported from @dnd-kit/sortable)
function arrayMove<T>(array: T[], from: number, to: number): T[] {
    const newArray = [...array];
    newArray.splice(to, 0, newArray.splice(from, 1)[0]);
    return newArray;
}