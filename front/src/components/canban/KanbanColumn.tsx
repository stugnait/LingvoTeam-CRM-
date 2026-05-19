// /components/kanban/KanbanColumn.tsx
'use client';

import React, { useMemo } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableTask from './SortableTask';
import ColumnDropZone from './ColumnDropZone';

export type TaskStatus = 'planned' | 'todo' | 'in_progress' | 'reject' | 'pause' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
interface KanbanColumn {
    id: string;
    title: string;
    status: TaskStatus;
    status_id: string; // '1', '2', '3', '4', '5', '6'
    taskIds: string[];
    color: string;
    icon: React.ReactNode;
}

interface KanbanTask {
    id: string
    title: string
    description?: string
    status: TaskStatus
    status_id: number
    priority: TaskPriority
    deadline?: string
    client_name: string
    avatar_url?: string | null

    // 👇 Нові поля
    intake_manager?: { name: string; avatar?: string } | null
    delivery_manager?: { name: string; avatar?: string } | null

    tags: string[]
    subtasks?: any[]
}

interface KanbanColumnProps {
    column: KanbanColumn
    tasks: KanbanTask[]
    onTaskOpen: (id: number) => void
}


const KanbanColumn: React.FC<KanbanColumnProps> = React.memo(({
                                                                  column,
                                                                  tasks,
                                                                  onTaskOpen
                                                              }) => {
    const taskIds = useMemo(() => tasks.map(t => t.id), [tasks]);

    // const {
    //     selectedTask,
    //     openOrderById,
    //     setSelectedTask,
    //     isModalOpen,
    //     isModalLoading,
    //     closeModal,
    //     downloadOrderFiles
    // } = useEditor()

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
            </div>

            <div className="flex-1 p-3 space-y-3 overflow-y-auto min-h-[200px] max-h-[calc(100vh-220px)]">
                <SortableContext
                    items={taskIds}
                    strategy={verticalListSortingStrategy}
                >
                    {tasks.map((task) => (
                        <SortableTask
                            key={task.id}
                            task={task}
                            onClick={() => onTaskOpen(Math.abs(Number(task.id)))}
                        />
                    ))}
                </SortableContext>

                {/*<SideModal*/}
                {/*    open={isModalOpen}*/}
                {/*    onOpenChange={closeModal}*/}
                {/*    title={*/}
                {/*        selectedTask*/}
                {/*            ? `Order #${selectedTask.id}`*/}
                {/*            : 'Loading'*/}
                {/*    }*/}
                {/*    isLoading={isModalLoading}*/}
                {/*    onSubmit={() => {*/}
                {/*    }}*/}
                {/*>*/}
                {/*    <div>some</div>*/}

                {/*    <button*/}
                {/*        onClick={() => downloadOrderFiles(selectedTask!.id)}*/}
                {/*        className="px-4 py-2 bg-blue-500 text-white rounded"*/}
                {/*    >*/}
                {/*        Download files*/}
                {/*    </button>*/}

                {/*</SideModal>*/}

                {/* Дроп-зона для порожніх колонок */}
                {tasks.length === 0 && <ColumnDropZone columnId={column.id}/>}

                {/*<button*/}
                {/*    onClick={onAddTask}*/}
                {/*    className={cn(*/}
                {/*        "w-full py-3 rounded-lg border border-dashed",*/}
                {/*        "flex items-center justify-center gap-2 text-sm",*/}
                {/*        "text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700",*/}
                {/*        "hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400",*/}
                {/*        "hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"*/}
                {/*    )}*/}
                {/*>*/}
                {/*    <Plus className="w-4 h-4" />*/}
                {/*    Add task*/}
                {/*</button>*/}
            </div>
        </div>
    );
});

KanbanColumn.displayName = 'KanbanColumn';

export default KanbanColumn;