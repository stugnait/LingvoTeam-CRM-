// /hooks/useEditor.ts
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { KanbanTask, KanbanColumn, OrderListItem } from '../types';
import { statusIdToTaskStatus } from '../types';
import { fetchOrders, updateOrderStatus, fetchOrderById } from '../services/orders';
import type { ProfileUser } from "@/src/features/profile/types";
import { ordersApi } from "@/src/features/editor/api";

// 👉 ДОДАНО: імпорт useToast
import { useToast } from "@/src/hooks/use-toast";

const initialColumns: KanbanColumn[] = [
    { id: 'planned',        title: 'Planned',        status: 'planned',        editor_status: '5',  taskIds: [], color: '#8b5cf6', icon: null },
    { id: 'todo',           title: 'To Do',           status: 'todo',           editor_status: '6',  taskIds: [], color: '#6366f1', icon: null },
    { id: 'in_translation', title: 'In Translation',  status: 'in_translation', editor_status: '1',  taskIds: [], color: '#f59e0b', icon: null },
    { id: 'in_checking',    title: 'In Checking',     status: 'in_checking',    editor_status: '8',  taskIds: [], color: '#3b82f6', icon: null },
    { id: 'revision',       title: 'Revision',        status: 'revision',       editor_status: '11', taskIds: [], color: '#ef4444', icon: null },
    { id: 'done',           title: 'Done',            status: 'done',           editor_status: '2',  taskIds: [], color: '#10b981', icon: null },
];

// Хелпер — витягує editor_status як рядок незалежно від формату API
const getEditorStatusId = (obj: any): string => {
    const raw = obj?.editor_status_id ?? obj?.editor_status?.id ?? obj?.editor_status;
    if (raw === null || raw === undefined || raw === '') {return '';}
    if (typeof raw === 'object') {return String(raw?.id ?? '');}
    return String(raw);
}

export const useEditor = () => {
    // 👉 ДОДАНО: ініціалізація тостів
    const { toast } = useToast();

    const [tasks, setTasks] = useState<KanbanTask[]>([]);
    const [selectedTask, setSelectedTask] = useState<OrderListItem | null>(null);
    const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);
    const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalLoading, setIsModalLoading] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [isEditorActionLoading, setIsEditorActionLoading] = useState(false);
    const [sourceFiles, setSourceFiles] = useState<any[]>([]);
    const [targetFiles, setTargetFiles] = useState<any[]>([]);
    const [filesLoading, setFilesLoading] = useState(false);
    const [downloadLoading, setDownloadLoading] = useState(false);

    /* ======================
       TOAST HELPERS
    ====================== */
    const handleError = useCallback((e: any, fallback: string) => {
        toast({
            title: "Error",
            description: e?.detail || fallback,
            variant: "error"
        });
    }, [toast]);

    const handleSuccess = useCallback((title: string, description: string) => {
        toast({
            title,
            description,
            variant: "success"
        });
    }, [toast]);

    /* ======================
       LOAD DATA
    ====================== */
    useEffect(() => {
        const loadOrders = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const fetchedTasks = await fetchOrders();
                setTasks(fetchedTasks);

                const newColumns = initialColumns.map(column => {
                    const matchingTasks = fetchedTasks.filter(task => {
                        const taskEditorStatus = getEditorStatusId(task)
                        return taskEditorStatus === column.editor_status
                    })
                    return { ...column, taskIds: matchingTasks.map(task => task.id.toString()) }
                })

                setColumns(newColumns);
            } catch (err: any) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                setError(`Failed to load orders: ${errorMessage}`);
                handleError(err, "Failed to load orders");
            } finally {
                setIsLoading(false);
            }
        };
        loadOrders();
    }, [handleError]);

    const refreshOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedTasks = await fetchOrders();
            setTasks(fetchedTasks);

            const newColumns = initialColumns.map(column => ({
                ...column,
                taskIds: fetchedTasks
                    .filter(task => getEditorStatusId(task) === column.editor_status)
                    .map(task => task.id.toString())
            }));

            setColumns(newColumns);
            setError(null);
            handleSuccess("Refreshed", "Orders updated successfully");
        } catch (err) {
            setError('Failed to refresh orders.');
            handleError(err, "Failed to refresh orders");
        } finally {
            setIsLoading(false);
        }
    }, [handleError, handleSuccess]);

    /* ======================
       EDITOR ACTIONS
    ====================== */
    const openEditorActionModal = useCallback(async (orderId: number) => {
        try {
            const order = await fetchOrderById(orderId);
            if (!order) { throw new Error('Order not found'); }
            const editorStatusId = getEditorStatusId(order);
            if (editorStatusId === '8') { setIsApproveModalOpen(true); return; }
            if (editorStatusId === '11') { setIsRejectModalOpen(true); return; }
            console.warn('No editor action for editor_status_id:', editorStatusId);
        } catch (e) {
            handleError(e, "Failed to load order details");
        }
    }, [handleError]);

    const rejectTranslation = useCallback(async (orderId: number, comment?: string) => {
        try {
            setIsEditorActionLoading(true);
            await ordersApi.rejectTranslation(orderId, comment);
            setIsRejectModalOpen(false);
            setIsModalOpen(false);
            setSelectedTask(null);
            handleSuccess("Success", "Translation rejected successfully");
        } catch (e) {
            handleError(e, "Failed to reject translation");
        } finally {
            setIsEditorActionLoading(false);
        }
    }, [handleError, handleSuccess]);

    const approveTranslation = useCallback(async (orderId: number, score: number, comment?: string, files?: File[]) => {
        try {
            setIsEditorActionLoading(true);
            await ordersApi.approveTranslation(orderId, { score, comment, files });
            setIsApproveModalOpen(false);
            setIsModalOpen(false);
            setSelectedTask(null);
            handleSuccess("Success", "Translation approved successfully");
        } catch (e) {
            handleError(e, "Failed to approve translation");
        } finally {
            setIsEditorActionLoading(false);
        }
    }, [handleError, handleSuccess]);

    /* ======================
       FILE DOWNLOAD
    ====================== */
    const downloadBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const downloadOrderSourceFiles = useCallback(async (orderId: number) => {
        try {
            const blob = await ordersApi.downloadFilesSource(orderId);
            downloadBlob(blob, `order_${orderId}_source.zip`);
            handleSuccess("Success", "Source files downloaded");
        } catch (error) {
            handleError(error, "Failed to download SOURCE files");
        }
    }, [handleError, handleSuccess]);

    const downloadOrderTargetFiles = useCallback(async (orderId: number) => {
        try {
            const blob = await ordersApi.downloadFilesTarget(orderId);
            downloadBlob(blob, `order_${orderId}_target.zip`);
            handleSuccess("Success", "Target files downloaded");
        } catch (error) {
            handleError(error, "Failed to download TARGET files");
        }
    }, [handleError, handleSuccess]);

    const loadOrderFiles = useCallback(async (orderId: number) => {
        setFilesLoading(true);
        try {
            const results = await Promise.allSettled([
                ordersApi.listDownloadFiles(orderId, 'source'),
                ordersApi.listDownloadFiles(orderId, 'target'),
            ]);
            const [sourceRes, targetRes] = results;
            setSourceFiles(sourceRes.status === 'fulfilled' ? (sourceRes.value.files || []) : []);
            setTargetFiles(targetRes.status === 'fulfilled' ? (targetRes.value.files || []) : []);
        } catch (error) {
            handleError(error, "Failed to load files");
        } finally {
            setFilesLoading(false);
        }
    }, [handleError]);

    const downloadSingleSourceFile = useCallback(async (orderId: number, fileId: number, filename: string) => {
        setDownloadLoading(true);
        try {
            const blob = await ordersApi.downloadFile(orderId, 'source', fileId);
            downloadBlob(blob, filename);
            handleSuccess("Success", "File downloaded");
        } catch (error) {
            handleError(error, "Failed to download source file");
        } finally {
            setDownloadLoading(false);
        }
    }, [handleError, handleSuccess]);

    const downloadSingleTargetFile = useCallback(async (orderId: number, fileId: number, filename: string) => {
        setDownloadLoading(true);
        try {
            const blob = await ordersApi.downloadFile(orderId, 'target', fileId);
            downloadBlob(blob, filename);
            handleSuccess("Success", "File downloaded");
        } catch (error) {
            handleError(error, "Failed to download target file");
        } finally {
            setDownloadLoading(false);
        }
    }, [handleError, handleSuccess]);

    /* ======================
       KANBAN DRAG & DROP
    ====================== */
    const tasksMap = useMemo(() =>
            new Map(tasks.map(task => [task.id.toString(), task])),
        [tasks]
    );

    const columnsMap = useMemo(() =>
            new Map(columns.map(col => [col.id, col])),
        [columns]
    );

    const handleDragStart = useCallback((taskId: string) => {
        const task = tasksMap.get(taskId);
        if (task) {
            setActiveTask(task);
            document.body.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
        }
    }, [tasksMap]);

    const handleDragEnd = useCallback(async (activeId: string, overId: string | null) => {
        setActiveTask(null);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        if (!overId) { return; }

        const sourceColumn = columns.find(col => col.taskIds.includes(activeId));
        if (!sourceColumn) { return; }

        const isOverColumn = columns.some(col => col.id === overId) || overId.startsWith('dropzone-');

        if (isOverColumn) {
            const targetColumnId = overId.startsWith('dropzone-') ? overId.replace('dropzone-', '') : overId;
            const targetColumn = columns.find(col => col.id === targetColumnId);
            if (!targetColumn || sourceColumn.id === targetColumn.id) { return; }

            const newEditorStatusId = targetColumn.editor_status;

            setTasks(prev => prev.map(task =>
                task.id.toString() === activeId
                    ? { ...task, editor_status_id: Number(newEditorStatusId), editor_status: Number(newEditorStatusId) }
                    : task
            ));

            setColumns(prev => prev.map(col => {
                if (col.id === sourceColumn.id) {return { ...col, taskIds: col.taskIds.filter(id => id !== activeId) };}
                if (col.id === targetColumn.id) {return { ...col, taskIds: [...col.taskIds, activeId] };}
                return col;
            }));

            try {
                await updateOrderStatus(parseInt(activeId), newEditorStatusId);
                handleSuccess("Updated", "Task status updated");
            } catch (error) {
                handleError(error, "Failed to update editor status");
            }
            return;
        }

        const targetColumn = columns.find(col => col.taskIds.includes(overId));
        if (!targetColumn) { return; }

        if (sourceColumn.id === targetColumn.id) {
            const oldIndex = sourceColumn.taskIds.indexOf(activeId);
            const newIndex = targetColumn.taskIds.indexOf(overId);
            if (oldIndex !== newIndex && newIndex >= 0) {
                setColumns(prev => prev.map(col =>
                    col.id === sourceColumn.id
                        ? { ...col, taskIds: arrayMove(col.taskIds, oldIndex, newIndex) }
                        : col
                ));
            }
        } else {
            const newEditorStatusId = targetColumn.editor_status;

            setTasks(prev => prev.map(task =>
                task.id.toString() === activeId
                    ? { ...task, editor_status_id: Number(newEditorStatusId), editor_status: Number(newEditorStatusId) }
                    : task
            ));

            setColumns(prev => prev.map(col => {
                if (col.id === sourceColumn.id) {return { ...col, taskIds: col.taskIds.filter(id => id !== activeId) };}
                if (col.id === targetColumn.id) {
                    const overIndex = targetColumn.taskIds.indexOf(overId);
                    const newTaskIds = [...targetColumn.taskIds];
                    newTaskIds.splice(overIndex + 1, 0, activeId);
                    return { ...col, taskIds: newTaskIds };
                }
                return col;
            }));

            try {
                await updateOrderStatus(parseInt(activeId), newEditorStatusId);
                handleSuccess("Updated", "Task status updated");
            } catch (error) {
                handleError(error, "Failed to update editor status");
            }
        }
    }, [columns, tasksMap, handleError, handleSuccess]);

    /* ======================
       MODAL CONTROLS
    ====================== */
    const handleUpdateTask = useCallback((taskId: string, updates: Partial<KanbanTask>) => {
        setTasks(prev => prev.map(task =>
            task.id.toString() === taskId ? { ...task, ...updates } : task
        ));
    }, []);

    const handleDeleteTask = useCallback((taskId: string) => {
        setTasks(prev => prev.filter(task => task.id.toString() !== taskId));
        setColumns(prev => prev.map(col => ({
            ...col,
            taskIds: col.taskIds.filter(id => id !== taskId)
        })));
    }, []);

    const openOrderById = useCallback(async (orderId: number) => {
        setIsModalLoading(true);
        try {
            const order = await fetchOrderById(orderId);
            if (!order) {throw new Error('Order not found');}

            setSelectedTask(order);
            await loadOrderFiles(orderId);

            const editorStatusId = getEditorStatusId(order);
            console.log('🔍 openOrderById:', { orderId, editor_status_raw: (order as any).editor_status, editorStatusId });

            if (['5', '6', '1', '2'].includes(editorStatusId)) {
                setIsModalOpen(true);
                return;
            }
            if (editorStatusId === '8') {
                setIsApproveModalOpen(true);
                return;
            }
            if (editorStatusId === '11') {
                setIsRejectModalOpen(true);
                return;
            }

            console.warn('Unknown editor_status_id, opening info modal as fallback:', editorStatusId);
            setIsModalOpen(true);
        } catch (e) {
            handleError(e, "Failed to load order details");
        } finally {
            setIsModalLoading(false);
        }
    }, [loadOrderFiles, handleError]);

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedTask(null);
    };

    const getTasksForColumn = useCallback((column: KanbanColumn) => {
        const columnTasks = column.taskIds
            .map(taskId => tasksMap.get(taskId))
            .filter(Boolean) as KanbanTask[];

        if (!searchQuery.trim()) { return columnTasks; }

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

    useEffect(() => {
        return () => {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, []);

    return {
        tasks, columns, activeTask, searchQuery, isLoading, error,
        selectedTask, isModalOpen, isModalLoading,
        closeModal, setSearchQuery, setActiveTask, setSelectedTask,
        downloadOrderSourceFiles, downloadOrderTargetFiles,
        tasksMap, columnsMap,
        handleDragStart, handleDragEnd, handleUpdateTask, handleDeleteTask, getTasksForColumn,
        refreshOrders, openOrderById,
        isRejectModalOpen, isApproveModalOpen, isEditorActionLoading,
        setIsRejectModalOpen, setIsApproveModalOpen,
        rejectTranslation, approveTranslation, openEditorActionModal,
        sourceFiles, targetFiles, filesLoading, downloadLoading,
        loadOrderFiles, downloadSingleSourceFile, downloadSingleTargetFile,
    };
};

function arrayMove<T>(array: T[], from: number, to: number): T[] {
    const newArray = [...array];
    newArray.splice(to, 0, newArray.splice(from, 1)[0]);
    return newArray;
}