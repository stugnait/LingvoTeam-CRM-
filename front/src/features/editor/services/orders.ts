// /services/orders.ts
import { ordersApi } from '../api'; // Adjust path based on your project structure
import {
    OrderListResponse,
    OrderListItem,
    KanbanTask,
    TaskPriority,
    TaskStatus,
    taskStatusToStatusId,
    statusIdToTaskStatus
} from '../types';

// Mock assignees for demo (you can replace with real API call)
const mockAssignees = [
    { id: 'user-1', name: 'Alex Johnson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
    { id: 'user-2', name: 'Maria Garcia', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria' },
    { id: 'user-3', name: 'David Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' },
    { id: 'user-4', name: 'Sarah Wilson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
    { id: 'user-5', name: 'Michael Brown', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael' },
];

// Helper to generate priority based on order data
const getPriorityFromOrder = (order: OrderListItem): TaskPriority => {
    // You can add logic based on order data
    // For now, using random or based on translator_id
    const priorities: TaskPriority[] = ['low', 'medium', 'high', 'critical'];
    const index = order.translator_id % priorities.length || 0;
    return priorities[index] || 'medium';
};

// Helper to generate tags based on order data
const getTagsFromOrder = (order: OrderListItem): string[] => {
    const tags = ['Translation'];

    // Add language pair info if available
    if (order.language_pair_id) {
        tags.push(`Pair-${order.language_pair_id}`);
    }

    // Add source language
    if (order.source_language) {
        tags.push(`Source-${order.source_language}`);
    }

    return tags;
};

// Helper to generate due date (example: 7 days from created_at)
const getDueDateFromOrder = (order: OrderListItem): Date => {
    const created = new Date(order.created_at);
    const dueDate = new Date(created);
    dueDate.setDate(dueDate.getDate() + 7); // 7 days from creation
    return dueDate;
};

// Convert API OrderListItem to KanbanTask
export const convertOrderToKanbanTask = (order: OrderListItem): KanbanTask => {
    // Generate title from order data
    const title = `Order #${order.id} - ${order.source_language}→${order.target_language}`;

    // Generate description
    const description = `Translation order for client ${order.client_id}. Language pair: ${order.language_pair_id}`;

    // Get assignee (mock for now - you can fetch real translator data)
    const assignee = mockAssignees[order.translator_id % mockAssignees.length] || mockAssignees[0];

    return {
        // OrderListItem fields
        ...order,
        id: order.id.toString(),
        client_name: order.client_name || "Unknown Client",

        // KanbanTask fields
        title,
        description,
        priority: getPriorityFromOrder(order),
        assignee,
        tags: getTagsFromOrder(order),
        dueDate: getDueDateFromOrder(order),
        status: statusIdToTaskStatus(String(order.status_id)),
    };
};

// Fetch orders from API and convert to KanbanTasks
export const fetchOrders = async (): Promise<KanbanTask[]> => {
    try {
        const response = await ordersApi.listOrders();

        // Convert each OrderListItem to KanbanTask
        const tasks = response.results.map(convertOrderToKanbanTask);

        return tasks;
    } catch (error) {
        console.error('Error fetching orders:', error);
        return []; // Return empty array on error
    }
};

// Update order status
// /services/orders.ts - детальне логування
export const updateOrderStatus = async (orderId: number, status_id: string): Promise<boolean> => {
    console.log('🔄 Виклик updateOrderStatus:', { orderId, status_id });

    try {
        // Перевірка чи правильно працює ordersApi.updateStatus
        console.log('📞 Виклик ordersApi.updateStatus...');

        // ТИМЧАСОВО: Додамо mock відповідь для тесту
        console.log('✅ Mock: Статус оновлено (тимчасово для тесту)');

        // Реальний виклик (розкоментуйте коли будете тестувати):
        const response = await ordersApi.updateStatus(orderId, { status_id });
        console.log('✅ Відповідь API:', response);

        return true;
    } catch (error) {
        console.error('❌ Помилка updateOrderStatus:', error);
        console.error('Деталі:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        return false;
    }
};

// Fetch single order by id and convert to KanbanTask
export const fetchOrderById = async (orderId: number): Promise<OrderListItem | null> => {
    try {
        console.log('📞 Fetch order by id:', orderId);

        const order = await ordersApi.getById(orderId);

        return order;
    } catch (error) {
        console.error('❌ Error fetching order by id:', error);
        return null;
    }
};


// Create new order (if needed)
// export const createOrder = async (taskData: Partial<KanbanTask>): Promise<KanbanTask | null> => {
//     try {
//         // Convert to FormData for API
//         const formData = new FormData();
//
//         // Add required fields
//         if (taskData.client_id) formData.append('client_id', taskData.client_id.toString());
//         if (taskData.source_language) formData.append('source_language', taskData.source_language.toString());
//         if (taskData.target_language) formData.append('target_language', taskData.target_language.toString());
//         if (taskData.translator_id) formData.append('translator_id', taskData.translator_id);
//         if (taskData.language_pair_id) formData.append('language_pair_id', taskData.language_pair_id.toString());
//
//         // Status will be set to the column's status
//         const status_id = taskData.status_id || '2';
//         formData.append('status_id', status_id);
//
//         const response = await ordersApi.create(formData);
//
//         // Create a new KanbanTask from the response
//         const newOrder: OrderListItem = {
//             id: response.order_id,
//             client_id: taskData.client_id || 0,
//             source_language: taskData.source_language || 0,
//             target_language: taskData.target_language || 0,
//             status_id: status_id,
//             created_at: new Date().toISOString(),
//             translator_id: taskData.translator_id || '',
//             language_pair_id: taskData.language_pair_id || 0,
//         };
//
//         return convertOrderToKanbanTask(newOrder);
//     } catch (error) {
//         console.error('Error creating order:', error);
//         return null;
//     }
// };