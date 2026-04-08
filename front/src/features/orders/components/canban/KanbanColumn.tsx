// /components/kanban/KanbanColumn.tsx
'use client';

import React, { useMemo } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { KanbanColumn as KanbanColumnType, KanbanTask } from '../../types';
import SortableTask from './SortableTask';
import ColumnDropZone from './ColumnDropZone';
import {useEditor} from "@/src/features/editor/hooks/useEditor";
import { cn } from '@/src/lib/utils';
import { SideModal } from '@/src/components/modals/SideModal';

interface KanbanColumnProps {
    column: KanbanColumnType
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
                            onClick={() => onTaskOpen(task.id)}
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