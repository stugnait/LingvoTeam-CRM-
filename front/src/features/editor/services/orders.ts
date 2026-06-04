// /services/orders.ts
import { ordersApi } from '../api';
import {
    OrderListResponse,
    OrderListItem,
    KanbanTask,
    TaskPriority,
    TaskStatus,
    taskStatusToStatusId,
    statusIdToTaskStatus
} from '../types';

const mockAssignees = [
    { id: 'user-1', name: 'Alex Johnson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
    { id: 'user-2', name: 'Maria Garcia', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria' },
    { id: 'user-3', name: 'David Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' },
    { id: 'user-4', name: 'Sarah Wilson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
    { id: 'user-5', name: 'Michael Brown', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael' },
];

const getPriorityFromOrder = (order: OrderListItem): TaskPriority => {
    const priorities: TaskPriority[] = ['low', 'medium', 'high', 'critical'];
    const index = order.translator_id % priorities.length || 0;
    return priorities[index] || 'medium';
};

const getTagsFromOrder = (order: OrderListItem): string[] => {
    const tags = ['Translation'];
    if (order.language_pair_id) tags.push(`Pair-${order.language_pair_id}`);
    if (order.source_language) tags.push(`Source-${order.source_language}`);
    return tags;
};

const getDueDateFromOrder = (order: OrderListItem): Date => {
    const created = new Date(order.created_at);
    const dueDate = new Date(created);
    dueDate.setDate(dueDate.getDate() + 7);
    return dueDate;
};

export const convertOrderToKanbanTask = (order: OrderListItem): KanbanTask => {
    const title = `Order #${order.id} - ${order.source_language}→${order.target_language}`;
    const description = `Translation order for client ${order.client_id}. Language pair: ${order.language_pair_id}`;
    const assignee = mockAssignees[order.translator_id % mockAssignees.length] || mockAssignees[0];

    // Читаємо editor_status_id — може прийти як editor_status_id або editor_status.id
    const editorStatusId = (order as any).editor_status_id
        ?? (order as any).editor_status?.id
        ?? (order as any).editor_status  // ← додай це — коли editor_status це просто число
        ?? null;

    return {
        ...order,
        id: order.id.toString(),
        client_name: order.client_name || "Unknown Client",
        editor_status_id: editorStatusId,
        title,
        description,
        priority: getPriorityFromOrder(order),
        assignee,
        tags: getTagsFromOrder(order),
        dueDate: getDueDateFromOrder(order),
        // status залишаємо для відображення (беремо з editor_status_id для editor канбана)
        status: statusIdToTaskStatus(String(editorStatusId ?? order.status_id)),
    };
};

export const fetchOrders = async (): Promise<KanbanTask[]> => {
    try {
        const response = await ordersApi.listOrders();
        return response.results.map(convertOrderToKanbanTask);
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
};

// Шле PATCH { editor_status: id } — оновлює тільки статус редактора
export const updateOrderStatus = async (orderId: number, editorStatusId: string): Promise<boolean> => {
    try {
        const response = await ordersApi.updateStatus(orderId, {
            editor_status: parseInt(editorStatusId)
        });
        console.log('✅ editor_status оновлено:', response);
        return true;
    } catch (error) {
        console.error('❌ Помилка updateOrderStatus:', error);
        return false;
    }
};

export const fetchOrderById = async (orderId: number): Promise<OrderListItem | null> => {
    try {
        const order = await ordersApi.getById(orderId);
        return order;
    } catch (error) {
        console.error('❌ Error fetching order by id:', error);
        return null;
    }
};