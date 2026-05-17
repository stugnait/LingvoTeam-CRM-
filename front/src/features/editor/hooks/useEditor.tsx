// /hooks/useEditor.ts
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { KanbanTask, KanbanColumn, statusIdToTaskStatus, taskStatusToStatusId, OrderListItem } from '../types';
import { fetchOrders, updateOrderStatus, fetchOrderById } from '../services/orders';
import type {ProfileUser} from "@/src/features/profile/types";
import {ordersApi} from "@/src/features/editor/api";

// Define columns based on status_id
const initialColumns: KanbanColumn[] = [
    {
        id: 'planned',
        title: 'Planned',
        status: 'planned',
        status_id: '1',
        taskIds: [],
        color: '#8b5cf6',
        icon: null
    },
    {
        id: 'todo',
        title: 'To Do',
        status: 'todo',
        status_id: '2',
        taskIds: [],
        color: '#6366f1',
        icon: null
    },
    {
        id: 'in_progress',
        title: 'In Progress',
        status: 'in_progress',
        status_id: '3',
        taskIds: [],
        color: '#f59e0b',
        icon: null
    },
    {
        id: 'reject',
        title: 'Reject',
        status: 'reject',
        status_id: '4',
        taskIds: [],
        color: '#ef4444',
        icon: null
    },
    {
        id: 'pause',
        title: 'Pause',
        status: 'pause',
        status_id: '5',
        taskIds: [],
        color: '#6b7280',
        icon: null
    },
    {
        id: 'done',
        title: 'Done',
        status: 'done',
        status_id: '6',
        taskIds: [],
        color: '#10b981',
        icon: null
    }
];

const ALLOWED_MODAL_STATUS_IDS = new Set(['1', '2', '3', '5'])
const STATUS = {
    COMPLETED: '4',
    REJECTED: '6',
} as const



export const useEditor = () => {
    const [tasks, setTasks] = useState<KanbanTask[]>([]);
    const [selectedTask, setSelectedTask] = useState<OrderListItem | null>(null)
    const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);
    const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isModalLoading, setIsModalLoading] = useState(false)
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
    const [isEditorActionLoading, setIsEditorActionLoading] = useState(false)
    const [sourceFiles, setSourceFiles] = useState<any[]>([])
    const [targetFiles, setTargetFiles] = useState<any[]>([])
    const [filesLoading, setFilesLoading] = useState(false)
    const [downloadLoading, setDownloadLoading] = useState(false)



    // Load orders from API on component mount
    // /hooks/useEditor.ts - оновлюємо useEffect
    useEffect(() => {
        const loadOrders = async () => {
            setIsLoading(true);
            setError(null);


            try {
                console.log('🔍 Завантаження ордерів з API...');
                const fetchedTasks = await fetchOrders();

                // Логуємо що прийшло
                console.log('📦 Отримано ордерів:', fetchedTasks.length);
                console.log('📋 Усі ордери з їх status_id:', fetchedTasks.map(t => ({
                    id: t.id,
                    status_id: t.status_id,
                    title: t.title
                })));

                setTasks(fetchedTasks);

                // Детальне логування розподілу
                console.log('📊 Статуси у колонках (що очікуємо):');
                initialColumns.forEach(col => {
                    console.log(`  - "${col.title}": status_id = "${col.status_id}"`);
                });

                console.log('📊 Розподіл ордерів по status_id:');
                const statusCounts: Record<string, number> = {};
                fetchedTasks.forEach(task => {
                    const status = task.status_id || 'unknown';
                    statusCounts[status] = (statusCounts[status] || 0) + 1;

                    // Логуємо кожен ордер
                    console.log(`  - Order #${task.id}: status_id = "${task.status_id}" (type: ${typeof task.status_id})`);
                });
                console.log('📈 Підсумок:', statusCounts);

                // Update columns with task IDs based on status_id
                const newColumns = initialColumns.map(column => {
                    // Знаходимо задачі, де status_id збігається з колонкою
                    const matchingTasks = fetchedTasks.filter(task => {
                        const taskStatus = String(task.status_id).trim();
                        const columnStatus = String(column.status_id).trim();

                        console.log(`🔍 Порівняння: task #${task.id} (status_id: "${taskStatus}") vs column "${column.title}" (status_id: "${columnStatus}")`);

                        const matches = taskStatus === columnStatus;
                        if (matches) {
                            console.log(`✅ Order #${task.id} потрапляє в "${column.title}"`);
                        }
                        return matches;
                    });

                    const taskIds = matchingTasks.map(task => task.id.toString());

                    console.log(`📂 Колонка "${column.title}" (status_id: "${column.status_id}"): знайдено ${matchingTasks.length} задач, taskIds:`, taskIds);
                    return {
                        ...column,
                        taskIds
                    };
                });

                setColumns(newColumns);
                console.log('✅ Дані успішно завантажено та оброблено');

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                console.error('❌ Помилка завантаження ордерів:', errorMessage, err);
                setError(`Failed to load orders: ${errorMessage}`);
            } finally {
                setIsLoading(false);
            }
        };

        loadOrders();
    }, []);

    const openEditorActionModal = useCallback(async (orderId: number) => {
        const order = await fetchOrderById(orderId)
        if (!order) {throw new Error('Order not found')}

        const statusId = String(order.status_id)

        if (statusId === STATUS.COMPLETED) {
            setIsApproveModalOpen(true)
            return
        }

        if (statusId === STATUS.REJECTED) {
            setIsRejectModalOpen(true)
            return
        }

        console.warn('No editor action for status:', statusId)
    }, [])


    const rejectTranslation = useCallback(
        async (orderId: number, comment?: string) => {
            try {
                setIsEditorActionLoading(true)


                await ordersApi.rejectTranslation(orderId, comment)

                // 🔄 після дії — оновлюємо дані

                setIsRejectModalOpen(false)
                setIsModalOpen(false)
                setSelectedTask(null)
            } catch (e) {
                console.error('❌ Reject translation failed:', e)
            } finally {
                setIsEditorActionLoading(false)
            }
        },
        []
    )

    // В useEditor.ts — змінюємо approveTranslation
    const approveTranslation = useCallback(
        async (
            orderId: number,
            score: number,
            comment?: string,
            files?: File[]
        ) => {
            try {
                setIsEditorActionLoading(true)

                await ordersApi.approveTranslation(orderId, {
                    score,
                    comment,
                    files,  // <-- передаємо файли
                })

                setIsApproveModalOpen(false)
                setIsModalOpen(false)
                setSelectedTask(null)
            } catch (e) {
                console.error('❌ Approve translation failed:', e)
            } finally {
                setIsEditorActionLoading(false)
            }
        },
        []
    )




    const downloadBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob)

        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        URL.revokeObjectURL(url)
    }


    const downloadOrderSourceFiles = useCallback(async (orderId: number) => {
        try {
            const blob = await ordersApi.downloadFilesSource(orderId)
            downloadBlob(blob, `order_${orderId}_source.zip`)
        } catch (error) {
            console.error('❌ Failed to download SOURCE files:', error)
        }
    }, [])

    const downloadOrderTargetFiles = useCallback(async (orderId: number) => {
        try {
            const blob = await ordersApi.downloadFilesTarget(orderId)
            downloadBlob(blob, `order_${orderId}_target.zip`)
        } catch (error) {
            console.error('❌ Failed to download TARGET files:', error)
        }
    }, [])

    // --- ФУНКЦІЇ ДЛЯ РОБОТИ З ФАЙЛАМИ ---
    const loadOrderFiles = useCallback(async (orderId: number) => {
        setFilesLoading(true);
        try {
            const results = await Promise.allSettled([
                ordersApi.listDownloadFiles(orderId, 'source'),
                ordersApi.listDownloadFiles(orderId, 'target')
            ]);

            const [sourceRes, targetRes] = results;

            // Обробка Source
            if (sourceRes.status === 'fulfilled') {
                setSourceFiles(sourceRes.value.files || []);
            } else {
                setSourceFiles([]); // Якщо папка порожня або помилка
            }

            // Обробка Target
            if (targetRes.status === 'fulfilled') {
                setTargetFiles(targetRes.value.files || []);
            } else {
                setTargetFiles([]);
            }
        } catch (error) {
            console.error("Failed to load files", error);
        } finally {
            setFilesLoading(false);
        }
    }, []);

    const downloadSingleSourceFile = useCallback(async (orderId: number, fileId: number, filename: string) => {
        setDownloadLoading(true);
        try {
            const blob = await ordersApi.downloadFile(orderId, 'source', fileId);
            downloadBlob(blob, filename);
        } catch (error) {
            console.error('Failed to download source file', error);
        } finally {
            setDownloadLoading(false);
        }
    }, []);

    const downloadSingleTargetFile = useCallback(async (orderId: number, fileId: number, filename: string) => {
        setDownloadLoading(true);
        try {
            const blob = await ordersApi.downloadFile(orderId, 'target', fileId);
            downloadBlob(blob, filename);
        } catch (error) {
            console.error('Failed to download target file', error);
        } finally {
            setDownloadLoading(false);
        }
    }, []);


    // Create maps for fast access
    const tasksMap = useMemo(() =>
            new Map(tasks.map(task => [task.id.toString(), task])),
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

    const handleDragEnd = useCallback(async (activeId: string, overId: string | null) => {
        setActiveTask(null);

        // Restore styles
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        if (!overId) {return;}

        const sourceColumn = columns.find(col => col.taskIds.includes(activeId));
        if (!sourceColumn) {return;}

        // Check if dragging to column or dropzone
        const isOverColumn = columns.some(col => col.id === overId) || overId.startsWith('dropzone-');

        if (isOverColumn) {
            const targetColumnId = overId.startsWith('dropzone-')
                ? overId.replace('dropzone-', '')
                : overId;

            const targetColumn = columns.find(col => col.id === targetColumnId);
            if (!targetColumn || sourceColumn.id === targetColumn.id) {return;}

            // Update task status in local state
            const taskId = parseInt(activeId);
            const newStatusId = targetColumn.status_id;
            const newStatus = targetColumn.status;

            setTasks(prev => prev.map(task =>
                task.id === taskId

                    ? {
                        ...task,
                        status_id: newStatusId,
                        status: statusIdToTaskStatus[newStatusId] // ← додати це
                    }
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

            // Update status on server
            try {
                await updateOrderStatus(taskId, newStatusId);
            } catch (error) {
                console.error('Failed to update order status:', error);
                // Optionally revert the change on error
            }

            return;
        }

        // Dragging to another task
        const targetColumn = columns.find(col => col.taskIds.includes(overId));
        if (!targetColumn) {return;}

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
        // Between columns - update status
        else {
            const taskId = parseInt(activeId);
            const newStatusId = targetColumn.status_id;
            const newStatus = targetColumn.status;

            // Update task status in local state
            setTasks(prev => prev.map(task =>
                task.id === taskId
                    ? { ...task, status_id: newStatusId, status: newStatus }
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

            // Update status on server
            try {
                await updateOrderStatus(taskId, newStatusId);
            } catch (error) {
                console.error('Failed to update order status:', error);
            }
        }
    }, [columns, tasksMap]);

    // // Add new task (for now, using mock data until we implement create API)
    // const handleAddTask = useCallback((columnId: string) => {
    //     const column = columns.find(col => col.id === columnId);
    //     if (!column) return;
    //
    //     // Generate a mock task for demo
    //     const newTask: KanbanTask = {
    //         id: Date.now(), // Temporary ID
    //         client_id: Math.floor(Math.random() * 100) + 1,
    //         source_language: 1,
    //         target_language: 2,
    //         status_id: column.status_id,
    //         created_at: new Date().toISOString(),
    //         translator_id: '1',
    //         language_pair_id: Math.floor(Math.random() * 10) + 1,
    //
    //         // KanbanTask fields
    //         title: `New Order #${Date.now() % 1000}`,
    //         description: 'New translation order',
    //         priority: 'medium',
    //         tags: ['New', 'Translation'],
    //         dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    //         assignee: {
    //             id: 'user-1',
    //             name: 'Alex Johnson',
    //             avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
    //         },
    //     };
    //
    //     setTasks(prev => [...prev, newTask]);
    //     setColumns(prev =>
    //         prev.map(col =>
    //             col.id === columnId
    //                 ? { ...col, taskIds: [...col.taskIds, newTask.id.toString()] }
    //                 : col
    //         )
    //     );
    // }, [columns]);

    // Update task
    const handleUpdateTask = useCallback((taskId: string, updates: Partial<KanbanTask>) => {
        setTasks(prev => prev.map(task =>
            task.id.toString() === taskId ? { ...task, ...updates } : task
        ));
    }, []);

    // Delete task
    const handleDeleteTask = useCallback((taskId: string) => {
        setTasks(prev => prev.filter(task => task.id.toString() !== taskId));
        setColumns(prev => prev.map(col => ({
            ...col,
            taskIds: col.taskIds.filter(id => id !== taskId)
        })));
    }, []);

    const openOrderById = useCallback(async (orderId: number) => {
        setIsModalLoading(true)

        try {
            const order = await fetchOrderById(orderId)
            if (!order) throw new Error('Order not found')

            setSelectedTask(order)

            await loadOrderFiles(orderId)

            const statusId = String(order.status_id)

            if (['1', '2', '3', '5'].includes(statusId)) {
                setIsModalOpen(true)
                return
            }

            if (statusId === '4') {
                setIsRejectModalOpen(true)
                return
            }

            if (statusId === '6') {
                setIsApproveModalOpen(true)
                return
            }

            console.warn('No modal for status:', statusId)
        } catch (e) {
            console.error(e)
        } finally {
            setIsModalLoading(false)
        }
    }, [])




    const closeModal = () => {
        setIsModalOpen(false)
        setSelectedTask(null)
    }


    // Filter tasks for column
    const getTasksForColumn = useCallback((column: KanbanColumn) => {
        const columnTasks = column.taskIds
            .map(taskId => tasksMap.get(taskId))
            .filter(Boolean) as KanbanTask[];

        if (!searchQuery.trim()) {return columnTasks;}

        const query = searchQuery.toLowerCase();
        return columnTasks.filter(task =>
            task.title.toLowerCase().includes(query) ||
            task.description?.toLowerCase().includes(query) ||
            task.tags.some(tag => tag.toLowerCase().includes(query)) ||
            task.assignee?.name.toLowerCase().includes(query) ||
            task.id.toString().includes(query) ||
            task.client_id.toString().includes(query)
        );
    }, [tasksMap, searchQuery]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, []);

    // Refresh orders
    const refreshOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedTasks = await fetchOrders();
            setTasks(fetchedTasks);

            const newColumns = initialColumns.map(column => ({
                ...column,
                taskIds: fetchedTasks
                    .filter(task => task.status_id === column.status_id)
                    .map(task => task.id.toString())
            }));

            setColumns(newColumns);
            setError(null);
        } catch (err) {
            setError('Failed to refresh orders.');
            console.error('Error refreshing orders:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        // State
        tasks,
        columns,
        activeTask,
        searchQuery,
        isLoading,
        error,
        selectedTask,
        isModalOpen,
        isModalLoading,


        closeModal,
        setSearchQuery,
        setActiveTask,
        setSelectedTask,
        downloadOrderSourceFiles,
        downloadOrderTargetFiles,

        // Maps
        tasksMap,
        columnsMap,

        // Handlers
        handleDragStart,
        handleDragEnd,
        // handleAddTask,
        handleUpdateTask,
        handleDeleteTask,
        getTasksForColumn,

        // Actions
        refreshOrders,
        openOrderById,
        isRejectModalOpen,
        isApproveModalOpen,
        isEditorActionLoading,
        setIsRejectModalOpen,
        setIsApproveModalOpen,

        // Editor actions
        rejectTranslation,
        approveTranslation,

        openEditorActionModal,
        sourceFiles,
        targetFiles,
        filesLoading,
        downloadLoading,
        loadOrderFiles,
        downloadSingleSourceFile,
        downloadSingleTargetFile,

    };
};

// Helper function for array moves
function arrayMove<T>(array: T[], from: number, to: number): T[] {
    const newArray = [...array];
    newArray.splice(to, 0, newArray.splice(from, 1)[0]);
    return newArray;
}