// /app/EditorMain.tsx
'use client';

import React, { useEffect } from 'react';
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
import KanbanHeader from '@/src/features/editor/components/canban/KanbanHeader';
import KanbanColumn from '@/src/features/editor/components/canban/KanbanColumn';
import KanbanStats from '@/src/features/editor/components/canban/KanbanStats';
import {SideModal} from "@/src/components/modals/SideModal";
import { Search } from 'lucide-react';
import {TaskModal} from "@/src/components/modals/jira/InfoModal";

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
import {RejectOrderModal} from "@/src/components/modals/jira/RejectOrderModal";
import {RatingModal} from "@/src/components/modals/jira/RatingModal";

// Map column status to icons
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
        // existing
        tasks,
        columns,
        activeTask,
        searchQuery,
        isLoading,
        error,
        setSearchQuery,
        setActiveTask,
        handleDragStart,
        handleDragEnd,
        getTasksForColumn,
        refreshOrders,
        selectedTask,
        isModalOpen,
        isModalLoading,
        openOrderById,
        closeModal,
        downloadOrderSourceFiles,
        downloadOrderTargetFiles,

        // 👉 ADD THIS
        isRejectModalOpen,
        isApproveModalOpen,
        isEditorActionLoading,
        setIsRejectModalOpen,
        setIsApproveModalOpen,
        rejectTranslation,
        approveTranslation,
        openEditorActionModal,
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

    // Handle refresh
    const handleRefresh = () => {
        refreshOrders();
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur border-b border-gray-200 dark:border-gray-800">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Translation Orders Kanban
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Drag and drop to update order status
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {error && (
                                <div className="text-red-500 text-sm bg-red-50 px-3 py-1 rounded">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleRefresh}
                                disabled={isLoading}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Refreshing...' : 'Refresh Orders'}
                            </button>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="search"
                                    placeholder="Search orders..."
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
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="mt-4 text-gray-500">Loading orders...</p>
                        </div>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <p className="text-gray-500">No orders found</p>
                            <button
                                onClick={handleRefresh}
                                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>
                ) : (
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
                                        onTaskOpen={openOrderById}
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
                                                formatPriority(activeTask.priority) === 'critical' ? 'bg-red-500' :
                                                    formatPriority(activeTask.priority) === 'high' ? 'bg-yellow-500' :
                                                        formatPriority(activeTask.priority) === 'medium' ? 'bg-blue-500' : 'bg-green-500'
                                            )} />
                                            <h3 className="font-medium text-sm text-gray-900 dark:text-white">
                                                {activeTask.title}
                                            </h3>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            Order #{activeTask.id} • Client #{activeTask.client_id}
                                        </div>
                                        {activeTask.assignee && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {activeTask.assignee.name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </DragOverlay>
                    </DndContext>
                )}

                {selectedTask &&
                    ['1', '2', '3', '5'].includes(String(selectedTask.status_id)) && (
                        <TaskModal
                            open={isModalOpen}
                            onOpenChange={closeModal}
                            taskId={selectedTask.id.toString()}
                            taskTitle={selectedTask.language_pair_name}
                            taskDescription={selectedTask.client_comment}
                            status={selectedTask.status_name}

                            priority={formatPriority(selectedTask.priority)}
                            priorityName={formatPriority(selectedTask.priority_display || selectedTask.priority)}

                            manager={selectedTask.manager_name}
                            translator={selectedTask.translator_name}

                            clientName={selectedTask.client_name}
                            languagePair={selectedTask.language_pair_name}
                            dueDate={formatDate(selectedTask.deadline)}

                            onDownloadOriginal={() =>
                                downloadOrderSourceFiles(selectedTask.id)
                            }
                            onDownloadTranslation={() =>
                                downloadOrderTargetFiles(selectedTask.id)
                            }
                            onCancel={closeModal}
                            onSave={closeModal}
                        />
                    )}

                {selectedTask &&
                    ['4'].includes(String(selectedTask.status_id)) && (
                    <RejectOrderModal
                        open={isRejectModalOpen}
                        onOpenChange={setIsRejectModalOpen}
                        isLoading={isEditorActionLoading}
                        onConfirm={(comment?: string) =>
                            rejectTranslation(selectedTask.id, comment)
                        }
                        onCancel={() => setIsRejectModalOpen(false)}
                    />
                )}

                {selectedTask &&
                    ['6'].includes(String(selectedTask.status_id)) && (
                    <RatingModal
                        open={isApproveModalOpen}
                        onOpenChange={setIsApproveModalOpen}
                        isLoading={isEditorActionLoading}
                        onConfirm={(score: number, comment?: string) =>
                            approveTranslation(selectedTask.id, score, comment)
                        }
                        onCancel={() => setIsApproveModalOpen(false)}
                    />
                )}




            </div>

            {/* Stats Bar */}
            <KanbanStats
                columns={columnsWithIcons}
                getTasksForColumn={getTasksForColumn}
            />
        </div>
    );
}

// Import Search icon
