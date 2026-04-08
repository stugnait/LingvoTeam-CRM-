"use client"

import React, { useState, useMemo, useEffect } from 'react'
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
    MeasuringStrategy
} from '@dnd-kit/core'

import KanbanColumn from '@/src/features/editor/components/canban/KanbanColumn'
import KanbanStats from '@/src/features/editor/components/canban/KanbanStats'

import { List, User, Target, Eye, CheckSquare, PauseCircle, XCircle } from 'lucide-react'
import { KanbanTask } from '@/src/features/editor/types'

const MANAGER_COLUMNS = [
    { id: 'all_orders', title: 'All Orders', status: 'all_orders', color: '#8b5cf6', icon: <List className="w-4 h-4" /> },
    { id: 'my_orders', title: 'My Orders', status: 'to_do', color: '#ec4899', icon: <User className="w-4 h-4" /> },
    { id: 'planned', title: 'Planned', status: 'planned', color: '#6366f1', icon: <Target className="w-4 h-4" /> },
    { id: 'in_progress', title: 'In Progress', status: 'in_progress', color: '#eab308', icon: <Eye className="w-4 h-4" /> },
    { id: 'pause', title: 'Pause', status: 'pause', color: '#f97316', icon: <PauseCircle className="w-4 h-4" /> },
    { id: 'rejected', title: 'Rejected', status: 'rejected', color: '#ef4444', icon: <XCircle className="w-4 h-4" /> },
    { id: 'done', title: 'Done', status: 'done', color: '#22c55e', icon: <CheckSquare className="w-4 h-4" /> },
]

const STATUS_DB_MAP: Record<string, number> = {
    'to_do': 6,
    'planned': 5,
    'in_progress': 7,
    'pause': 4,
    'rejected': 3,
    'done': 2,
};

interface OrdersKanbanBoardProps {
    orders: any[]
    updateOrder: (id: number, payload: any) => Promise<void>
    onTaskOpen: (id: number) => void
}

export default function OrdersKanbanBoard({ orders, updateOrder, onTaskOpen }: OrdersKanbanBoardProps) {
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

    // 👉 ДОДАНО: Локальний стан для оптимістичного оновлення (щоб картка не стрибала назад)
    const [localOrders, setLocalOrders] = useState(orders)

    // 👉 ДОДАНО: Синхронізуємо локальний стан з даними від сервера, коли вони приходять
    useEffect(() => {
        setLocalOrders(orders)
    }, [orders])

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 }
        })
    )

    // Змінено `orders` на `localOrders`
    const formattedTasks = useMemo<KanbanTask[]>(() => {
        return localOrders.map(order => {
            let frontendStatus = 'all_orders';

            if (order.status_id === 6) frontendStatus = 'to_do';
            else if (order.status_id === 5) frontendStatus = 'planned';
            else if (order.status_id === 7) frontendStatus = 'in_progress';
            else if (order.status_id === 4) frontendStatus = 'pause';
            else if (order.status_id === 3) frontendStatus = 'rejected';
            else if (order.status_id === 2) frontendStatus = 'done';

            return {
                id: order.id,
                title: order.language_pair_name || `Order #${order.id}`,
                priority: (order.priority?.toLowerCase() || 'medium') as 'low'|'medium'|'high'|'critical',
                description: order.client_comment || '',
                client_id: order.client_id,
                language_pair_id: order.language_pair_id || 'N/A',
                tags: [],
                status: frontendStatus,
                dueDate: order.deadline,
                assignee: order.translator_name ? { name: order.translator_name, avatar: undefined } : undefined
            }
        })
    }, [localOrders])

    const activeTask = activeTaskId ? formattedTasks.find(t => String(t.id) === activeTaskId) : null

    const getTasksForColumn = (column: any) => {
        return formattedTasks.filter(task => task.status === column.status)
    }

    const onDragStart = (event: DragStartEvent) => {
        setActiveTaskId(event.active.id as string)
    }

    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        setActiveTaskId(null)

        if (!over) return

        const taskId = Number(active.id)
        const overId = String(over.id)

        const isDropOverEmptyColumn = overId.startsWith('dropzone-')
        const isDropOverColumnHeader = MANAGER_COLUMNS.some(c => c.id === overId)

        let newStatus = ''

        if (isDropOverEmptyColumn) {
            newStatus = overId.replace('dropzone-', '')
        } else if (isDropOverColumnHeader) {
            newStatus = overId
        } else {
            const targetTask = formattedTasks.find(t => String(t.id) === overId)
            if (targetTask) { newStatus = targetTask.status }
        }

        const currentTask = formattedTasks.find(t => t.id === taskId)

        if (currentTask?.status === 'all_orders' || newStatus === 'all_orders') {
            return;
        }

        if (currentTask && newStatus && currentTask.status !== newStatus) {
            const newStatusIdDb = STATUS_DB_MAP[newStatus];

            if (newStatusIdDb) {
                // 👉 1. Миттєво оновлюємо UI локально (картка стає на нове місце миттєво)
                setLocalOrders(prevOrders =>
                    prevOrders.map(order =>
                        order.id === taskId
                            ? { ...order, status_id: newStatusIdDb }
                            : order
                    )
                );

                // 👉 2. Відправляємо запит на бекенд у фоні
                updateOrder(taskId, { status_id: newStatusIdDb }).catch((error) => {
                    // Якщо сталася помилка на сервері, можна повернути старий статус
                    console.error("Помилка при зміні статусу:", error);
                    setLocalOrders(orders); // Відкат до старих даних з бекенду
                });
            }
        }
    }

    return (
        <div className="w-full max-w-full overflow-hidden bg-gray-50/50 dark:bg-gray-900/20 rounded-xl relative">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                measuring={{droppable: {strategy: MeasuringStrategy.Always}}}
            >
                <div className="flex gap-6 overflow-x-auto p-6 min-h-[calc(100vh-250px)]">
                    {MANAGER_COLUMNS.map((column) => {
                        const columnTasks = getTasksForColumn(column)

                        return (
                            <KanbanColumn
                                key={column.id}
                                column={column as any}
                                tasks={columnTasks}
                                onTaskOpen={onTaskOpen}
                            />
                        )
                    })}
                </div>

                <DragOverlay>
                    {activeTask && (
                        <div
                            className={`shadow-2xl rounded-lg border-2 bg-white dark:bg-gray-800 rotate-2 opacity-90 p-4 w-[280px] ${
                                activeTask.status === 'all_orders' ? 'border-red-500' : 'border-blue-500'
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <div className={`w-2 h-2 rounded-full ${
                                    activeTask.priority === 'critical' ? 'bg-red-500' :
                                        activeTask.priority === 'high' ? 'bg-yellow-500' :
                                            activeTask.priority === 'medium' ? 'bg-blue-500' : 'bg-green-500'
                                }`}/>
                                <h3 className="font-medium text-sm">
                                    {activeTask.title}
                                </h3>
                            </div>
                            <div className="text-xs text-gray-500">
                                Order #{activeTask.id} • Client #{activeTask.client_id}
                            </div>

                            {activeTask.status === 'all_orders' && (
                                <div className="mt-2 text-[10px] text-red-500 font-bold uppercase">
                                    Перетягування заборонено
                                </div>
                            )}
                        </div>
                    )}
                </DragOverlay>
            </DndContext>
        </div>
    )
}