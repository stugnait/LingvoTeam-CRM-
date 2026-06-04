'use client';

import React, { useMemo, useState, useCallback } from 'react';
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

import KanbanHeader from '@/src/components/canban/KanbanHeader';
import KanbanColumn from '@/src/components/canban/KanbanColumn';
import KanbanStats from '@/src/components/canban/KanbanStats';
import { TaskModal } from "@/src/components/modals/jira/InfoModal";
import { filterTasksByDeadline, type DeadlineFilter } from '@/src/components/canban/KanbanDeadlineFilter';

import { useEditor } from '../hooks/useEditor';
import { KanbanTask, formatPriority } from '../types';
import { cn } from '@/src/lib/utils';

import {
    Target,
    Clock,
    Languages,
    Search,
    RotateCcw,
    CheckSquare,
} from 'lucide-react';
import { RejectOrderModal } from "@/src/components/modals/jira/RejectOrderModal";
import { RatingModal } from "@/src/components/modals/jira/RatingModal";

// Іконки відповідають новим статусам editor канбана
const COLUMN_ICONS: Record<string, React.ReactNode> = {
    planned:        <Target className="w-4 h-4" />,
    todo:           <Clock className="w-4 h-4" />,
    in_translation: <Languages className="w-4 h-4" />,
    in_checking:    <Search className="w-4 h-4" />,
    revision:       <RotateCcw className="w-4 h-4" />,
    done:           <CheckSquare className="w-4 h-4" />,
};

const formatDate = (dateString?: string) => {
    if (!dateString) { return 'Не вказано'; }
    try {
        return new Intl.DateTimeFormat('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(dateString));
    } catch {
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

    const formattedTasks = useMemo(() => {
        return tasks.map(task => ({
            ...task,
            id: task.id.toString(),
            title: (task as any).language_pair_name || `Order #${task.id}`,
            priority: (task.priority?.toLowerCase() || 'medium') as any,
            intake_manager: (task as any).manager_accept_name && (task as any).manager_accept_name !== '-'
                ? { name: (task as any).manager_accept_name, avatar: (task as any).manager_accept_avatar || undefined }
                : null,
            delivery_manager: (task as any).manager_delivery_name && (task as any).manager_delivery_name !== '-'
                ? { name: (task as any).manager_delivery_name, avatar: (task as any).manager_delivery_avatar || undefined }
                : null,
        }));
    }, [tasks]);

    const allTasks = useMemo(() => formattedTasks, [formattedTasks]);

    // ✅ Фільтруємо по taskIds з хука — там вже правильний розподіл по editor_status_id
    const getFormattedTasksForColumn = useCallback((column: any) => {
        const columnTasks = formattedTasks.filter(
            t => column.taskIds.includes(t.id.toString())
        ) as KanbanTask[];
        return filterTasksByDeadline(columnTasks, deadlineFilter);
    }, [formattedTasks, deadlineFilter]);

    const columnsWithIcons = useMemo(() =>
            columns.map(col => ({
                ...col,
                icon: COLUMN_ICONS[col.status] ?? null
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
                                    tasks={getFormattedTasksForColumn(column) as any}
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

                {/* InfoModal — для всіх статусів де просто дивимось інфо */}
                {selectedTask && (
                    <TaskModal
                        open={isModalOpen}
                        onOpenChange={closeModal}
                        taskId={selectedTask.id.toString()}
                        taskTitle={(selectedTask as any).language_pair_name || `Order #${selectedTask.id}`}
                        taskDescription={(selectedTask as any).client_comment || 'Немає коментаря'}
                        status={(selectedTask as any).status_name}
                        priority={formatPriority((selectedTask as any).priority)}
                        translator={(selectedTask as any).translator_name || 'Не призначено'}
                        intake_manager={(selectedTask as any).manager_accept_name
                            ? { id: 0, name: (selectedTask as any).manager_accept_name, avatar: undefined }
                            : null}
                        delivery_manager={(selectedTask as any).manager_delivery_name && (selectedTask as any).manager_delivery_name !== '-'
                            ? { id: 0, name: (selectedTask as any).manager_delivery_name, avatar: undefined }
                            : null}
                        clientName={(selectedTask as any).client_name}
                        languagePair={(selectedTask as any).language_pair_name}
                        dueDate={formatDate((selectedTask as any).deadline)}
                        onDownloadOriginal={() => downloadOrderSourceFiles(selectedTask.id)}
                        onDownloadTranslation={() => downloadOrderTargetFiles(selectedTask.id)}
                        onCancel={closeModal}
                        onSave={closeModal}
                        editor={(selectedTask as any).editor_name || 'Не призначено'}
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

                {/* RejectModal — відкриття контролює useEditor по editor_status_id === '11' */}
                {selectedTask && (
                    <RejectOrderModal
                        open={isRejectModalOpen}
                        onOpenChange={setIsRejectModalOpen}
                        isLoading={isEditorActionLoading}
                        onConfirm={(comment) => rejectTranslation(selectedTask.id, comment)}
                        onCancel={() => setIsRejectModalOpen(false)}
                    />
                )}

                {/* RatingModal — відкриття контролює useEditor по editor_status_id === '8' */}
                {selectedTask && (
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
                columns={columnsWithIcons as any}
                getTasksForColumn={getFormattedTasksForColumn}
            />
        </div>
    );
}