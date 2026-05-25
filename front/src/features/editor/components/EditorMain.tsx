'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
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

// Components
import KanbanHeader from '@/src/components/canban/KanbanHeader';
import KanbanColumn from '@/src/components/canban/KanbanColumn';
import KanbanStats from '@/src/components/canban/KanbanStats';
import { TaskModal } from "@/src/components/modals/jira/InfoModal";
import { filterTasksByDeadline, type DeadlineFilter } from '@/src/components/canban/KanbanDeadlineFilter';

// Hooks and types
import { useEditor } from '../hooks/useEditor';
import { KanbanTask, formatPriority } from '../types';
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
import { RejectOrderModal } from "@/src/components/modals/jira/RejectOrderModal";
import { RatingModal } from "@/src/components/modals/jira/RatingModal";

const COLUMN_ICONS = {
    planned: <Target className="w-4 h-4" />,
    todo: <Clock className="w-4 h-4" />,
    in_progress: <Eye className="w-4 h-4" />,
    reject: <XCircle className="w-4 h-4" />,
    pause: <PauseCircle className="w-4 h-4" />,
    done: <CheckSquare className="w-4 h-4" />,
};

const formatDate = (dateString?: string) => {
    if (!dateString) return 'Не вказано';
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    } catch (e) {
        return dateString;
    }
};

export default function EditorMain() {
    const {
        tasks,
        columns,
        activeTask,
        searchQuery,
        isLoading,
        error,
        setSearchQuery,
        handleDragStart,
        handleDragEnd,
        refreshOrders,
        selectedTask,
        isModalOpen,
        openOrderById,
        closeModal,
        downloadOrderSourceFiles,
        downloadOrderTargetFiles,
        isRejectModalOpen,
        isApproveModalOpen,
        isEditorActionLoading,
        setIsRejectModalOpen,
        setIsApproveModalOpen,
        rejectTranslation,
        approveTranslation,
        sourceFiles,
        targetFiles,
        filesLoading,
        downloadLoading,
        loadOrderFiles,
        downloadSingleSourceFile,
        downloadSingleTargetFile,
    } = useEditor();

    const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>('all');

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 }
        })
    );

    // Форматування тасок — оголошуємо ПЕРШИМ
    const formattedTasks = useMemo(() => {
        return tasks.map(task => ({
            ...task,
            id: task.id.toString(),
            title: task.language_pair_name || `Order #${task.id}`,
            priority: (task.priority?.toLowerCase() || 'medium') as any,
            intake_manager: task.manager_accept_name && task.manager_accept_name !== '-'
                ? {
                    name: task.manager_accept_name,
                    avatar: (task as any).manager_accept_avatar || undefined
                }
                : null,
            delivery_manager: task.manager_delivery_name && task.manager_delivery_name !== '-'
                ? {
                    name: task.manager_delivery_name,
                    avatar: (task as any).manager_delivery_avatar || undefined
                }
                : null,
        }));
    }, [tasks]);

    // allTasks для фільтр-бару — всі таски без фільтрації по дедлайну
    const allTasks = useMemo(() => formattedTasks, [formattedTasks]);

    // Таски для колонки — з урахуванням deadlineFilter
    const getFormattedTasksForColumn = useCallback((column: any) => {
        const columnTasks = formattedTasks.filter(
            t => t.status === column.status
        ) as KanbanTask[];
        return filterTasksByDeadline(columnTasks, deadlineFilter);
    }, [formattedTasks, deadlineFilter]);

    const columnsWithIcons = useMemo(() =>
            columns.map(col => ({
                ...col,
                icon: COLUMN_ICONS[col.status as keyof typeof COLUMN_ICONS]
            })),
        [columns]
    );

    const onDragStart = (event: DragStartEvent) => {
        handleDragStart(event.active.id as string);
    };

    const onDragEnd = (event: DragEndEvent) => {
        handleDragEnd(event.active.id as string, event.over?.id as string | null);
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            <KanbanHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                isLoading={isLoading}
                error={error}
                onRefresh={refreshOrders}
                deadlineFilter={deadlineFilter}
                onDeadlineFilterChange={setDeadlineFilter}
                allTasks={allTasks}
            />

            <div className="p-3 sm:p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
                    >
                        <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 -mx-3 sm:-mx-6 px-3 sm:px-6">
                            {columnsWithIcons.map((column) => (
                                <KanbanColumn
                                    key={column.id}
                                    column={column as any}
                                    tasks={getFormattedTasksForColumn(column)}
                                    onTaskOpen={openOrderById}
                                />
                            ))}
                        </div>

                        <DragOverlay>
                            {activeTask && (
                                <div className="shadow-2xl rounded-lg border-2 border-blue-500 bg-white dark:bg-gray-800 p-4 w-[280px]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            formatPriority(activeTask.priority) === 'critical' ? 'bg-red-500' : 'bg-blue-500'
                                        )} />
                                        <h3 className="font-medium text-sm text-gray-900 dark:text-white">
                                            {activeTask.title}
                                        </h3>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Order #{activeTask.id}
                                    </div>
                                </div>
                            )}
                        </DragOverlay>
                    </DndContext>
                )}

                {selectedTask && (
                    <TaskModal
                        open={isModalOpen}
                        onOpenChange={closeModal}
                        taskId={selectedTask.id.toString()}
                        taskTitle={selectedTask.language_pair_name || `Order #${selectedTask.id}`}
                        taskDescription={selectedTask.client_comment || 'Немає коментаря'}
                        status={selectedTask.status_name}
                        priority={formatPriority(selectedTask.priority)}
                        translator={selectedTask.translator_name || 'Не призначено'}
                        intake_manager={selectedTask.manager_accept_name
                            ? { id: 0, name: selectedTask.manager_accept_name, avatar: undefined }
                            : null}
                        delivery_manager={selectedTask.manager_delivery_name && selectedTask.manager_delivery_name !== '-'
                            ? { id: 0, name: selectedTask.manager_delivery_name, avatar: undefined }
                            : null}
                        clientName={selectedTask.client_name}
                        languagePair={selectedTask.language_pair_name}
                        dueDate={formatDate(selectedTask.deadline)}
                        onDownloadOriginal={() => downloadOrderSourceFiles(selectedTask.id)}
                        onDownloadTranslation={() => downloadOrderTargetFiles(selectedTask.id)}
                        onCancel={closeModal}
                        onSave={closeModal}
                        editor={selectedTask.editor_name || 'Не призначено'}
                        orderId={selectedTask.id}
                        sourceFiles={sourceFiles}
                        targetFiles={targetFiles}
                        filesLoading={filesLoading}
                        downloadLoading={downloadLoading}
                        onLoadFiles={loadOrderFiles}
                        onDownloadSingleSource={downloadSingleSourceFile}
                        onDownloadSingleTarget={downloadSingleTargetFile}
                    />
                )}

                {selectedTask && String(selectedTask.status_id) === '4' && (
                    <RejectOrderModal
                        open={isRejectModalOpen}
                        onOpenChange={setIsRejectModalOpen}
                        isLoading={isEditorActionLoading}
                        onConfirm={(comment) => rejectTranslation(selectedTask.id, comment)}
                        onCancel={() => setIsRejectModalOpen(false)}
                    />
                )}

                {selectedTask && String(selectedTask.status_id) === '6' && (
                    <RatingModal
                        open={isApproveModalOpen}
                        onOpenChange={setIsApproveModalOpen}
                        isLoading={isEditorActionLoading}
                        onConfirm={(rating, comment, files) =>
                            approveTranslation(selectedTask.id, rating, comment, files)
                        }
                        onCancel={() => setIsApproveModalOpen(false)}
                    />
                )}
            </div>

            <KanbanStats
                columns={columnsWithIcons}
                getTasksForColumn={getFormattedTasksForColumn}
            />
        </div>
    );
}