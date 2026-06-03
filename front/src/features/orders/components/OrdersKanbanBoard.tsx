"use client"

import React, { useState, useMemo, useEffect } from 'react'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
    MeasuringStrategy
} from '@dnd-kit/core'

import KanbanColumn from '@/src/components/canban/KanbanColumn'
import { Target, Eye, CheckSquare, PauseCircle, XCircle, Filter } from 'lucide-react'
import type { KanbanTask } from '@/src/components/canban/SortableTask'
import { cn } from '@/src/lib/utils'

const MANAGER_COLUMNS = [
    { id: 'planned',    title: 'Planned',     status: 'planned',     color: '#6366f1', icon: <Target      className="w-4 h-4" /> },
    { id: 'in_progress',title: 'In Progress', status: 'in_progress', color: '#eab308', icon: <Eye         className="w-4 h-4" /> },
    { id: 'pause',      title: 'Pause',       status: 'pause',       color: '#f97316', icon: <PauseCircle className="w-4 h-4" /> },
    { id: 'rejected',   title: 'Rejected',    status: 'rejected',    color: '#ef4444', icon: <XCircle     className="w-4 h-4" /> },
    { id: 'done',       title: 'Done',        status: 'done',        color: '#22c55e', icon: <CheckSquare className="w-4 h-4" /> },
]

const STATUS_DB_MAP: Record<string, number> = {
    'planned':     5,
    'in_progress': 7,
    'pause':       4,
    'rejected':    3,
    'done':        2,
}

interface OrdersKanbanBoardProps {
    orders: any[]
    currentUserId: number
    isOnlyMine: boolean
    updateOrder: (id: number, payload: any) => Promise<void>
    onTaskOpen: (id: number) => void
}

export default function OrdersKanbanBoard({ orders, currentUserId, isOnlyMine, updateOrder, onTaskOpen }: OrdersKanbanBoardProps) {
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
    const [localOrders, setLocalOrders] = useState(orders)

    useEffect(() => {
        setLocalOrders(orders)
    }, [orders])

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    )

    const filteredOrders = useMemo(() => {
        if (!isOnlyMine) return localOrders
        return localOrders.filter(order =>
            order.manager_accept_id === Number(currentUserId) ||
            order.manager_delivery_id === Number(currentUserId)
        )
    }, [localOrders, currentUserId, isOnlyMine])

    const formattedTasks = useMemo<KanbanTask[]>(() => {
        const tasks: any[] = []

        filteredOrders.forEach(order => {
            const baseTask = {
                title: order.language_pair_name || `Order #${order.id}`,
                priority: (order.priority?.toLowerCase() || 'medium') as 'low' | 'medium' | 'high' | 'critical',
                description: order.client_comment || '',
                client_name: order.client_name || 'none',
                language_pair_id: order.language_pair_id || 'N/A',
                tags: [],
                deadline: order.deadline,
                intake_manager: order.manager_accept_name
                    ? { name: order.manager_accept_name, avatar: order.manager_accept_avatar ?? undefined }
                    : null,
                delivery_manager: order.manager_delivery_name && order.manager_delivery_name !== '-'
                    ? { name: order.manager_delivery_name, avatar: order.manager_delivery_avatar ?? undefined }
                    : null,
            }

            let frontendStatus = ''
            if (order.status_id === 6)      { frontendStatus = 'planned' }  // to_do → показуємо в planned
            else if (order.status_id === 5) { frontendStatus = 'planned' }
            else if (order.status_id === 7) { frontendStatus = 'in_progress' }
            else if (order.status_id === 4) { frontendStatus = 'pause' }
            else if (order.status_id === 3) { frontendStatus = 'rejected' }
            else if (order.status_id === 2) { frontendStatus = 'done' }

            if (frontendStatus) {
                tasks.push({ ...baseTask, id: order.id, status: frontendStatus })
            }
        })

        return tasks
    }, [filteredOrders])

    const activeTask = activeTaskId ? formattedTasks.find(t => String(t.id) === activeTaskId) : null

    const getTasksForColumn = (column: any) =>
        formattedTasks.filter(task => task.status === column.status)

    const onDragStart = (event: DragStartEvent) => {
        setActiveTaskId(event.active.id as string)
    }

    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        setActiveTaskId(null)

        if (!over) { return }

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

        const currentTask = formattedTasks.find(t => String(t.id) === String(taskId))

        if (!currentTask || !newStatus || currentTask.status === newStatus) { return }

        const newStatusIdDb = STATUS_DB_MAP[newStatus]
        if (!newStatusIdDb) { return }

        setLocalOrders(prevOrders =>
            prevOrders.map(order =>
                order.id === taskId
                    ? { ...order, status_id: newStatusIdDb }
                    : order
            )
        )

        updateOrder(taskId, { status_id: newStatusIdDb }).catch((error) => {
            console.error('Помилка при зміні статусу:', error)
            setLocalOrders(orders)
        })
    }

    return (
        <div className="w-full max-w-full overflow-hidden bg-gray-50/50 dark:bg-gray-900/20 rounded-xl relative">

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
            >
                <div className="flex gap-4 sm:gap-6 overflow-x-auto p-3 sm:p-6 min-h-[calc(100vh-250px)]">
                    {MANAGER_COLUMNS.map((column) => (
                        <KanbanColumn
                            key={column.id}
                            column={column as any}
                            tasks={getTasksForColumn(column)}
                            onTaskOpen={(id) => onTaskOpen(Math.abs(id))}
                        />
                    ))}
                </div>

                <DragOverlay>
                    {activeTask && (
                        <div className="shadow-2xl rounded-lg border-2 border-blue-500 bg-white dark:bg-gray-800 rotate-2 opacity-90 p-4 w-[280px]">
                            <div className="flex items-center gap-2 mb-3">
                                <div className={`w-2 h-2 rounded-full ${
                                    activeTask.priority === 'critical' ? 'bg-red-500' :
                                        activeTask.priority === 'high'     ? 'bg-yellow-500' :
                                            activeTask.priority === 'medium'   ? 'bg-blue-500' : 'bg-green-500'
                                }`} />
                                <h3 className="font-medium text-sm">{activeTask.title}</h3>
                            </div>
                            <div className="text-xs text-gray-500">
                                Order #{activeTask.id} • {activeTask.client_name}
                            </div>
                        </div>
                    )}
                </DragOverlay>
            </DndContext>
        </div>
    )
}