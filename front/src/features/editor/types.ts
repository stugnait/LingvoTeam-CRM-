// /types/kanban.ts
export type TaskStatus = 'planned' | 'todo' | 'in_progress' | 'reject' | 'pause' | 'done' | 'in_translation' | 'in_checking' | 'revision';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

// API Order type from your backend
export interface OrderListItem {
    editor_name: string;
    id: number
    client_id: number
    source_language: number
    target_language: number
    status_id: number
    status_name: string
    created_at: string // ISO
    translator_id: number
    language_pair_id: number
    client_name: string
    deadline: string
    priority: "low" | "medium" | "high" | "critical"
    manager_accept_id?: number
    manager_accept_name?: string
    manager_delivery_id?: number
    manager_delivery_name?: string
    manager_avatar?: string | null
    translator_avatar?: string | null
    language_pair_name?: string
    client_comment?: string
    translator_name?: string
    manager_name?: string
    status?: string
}

export interface OrderListResponse {
    results: OrderListItem[]
    total: number
}

// Our Kanban Task now extends OrderListItem
export interface KanbanTask extends Omit<OrderListItem, 'id'> {
    id: string;
    editor_status_id?: number;
    editor_status?: number;
    client_name: string;
    title: string;
    description?: string;
    priority: TaskPriority;
    assignee?: {
        id: string | number;
        name: string;
        avatar?: string;
    };
    tags: string[];
    dueDate?: Date | string;
    subtasks?: any[];
}

export interface KanbanColumn {
    id: string;
    title: string;
    status: TaskStatus;
    status_id: string; // '1', '2', '3', '4', '5', '6'
    taskIds: string[];
    color: string;
    icon: React.ReactNode;
}

// Helper to map status_id to TaskStatus
export const statusIdToTaskStatus = (status_id: string): TaskStatus => {
    const mapping: Record<string, TaskStatus> = {
        '1': 'planned',
        '2': 'todo',
        '3': 'in_progress',
        '4': 'reject',
        '5': 'pause',
        '6': 'done',
    };
    return mapping[status_id] || 'todo';
};

// Helper to map TaskStatus to status_id
// export const taskStatusToStatusId = (status: TaskStatus): string => {
//     const mapping: Record<TaskStatus, string> = {
//         'planned': '1',
//         'todo': '2',
//         'in_progress': '3',
//         'reject': '4',
//         'pause': '5',
//         'done': '6',
//     };
//     return mapping[status];
// };

export const formatPriority = (priorityValue: string | number): TaskPriority => {
    const stringValue = String(priorityValue);
    const mapping: Record<string, TaskPriority> = {
        '1': 'low',
        '2': 'medium',
        '3': 'high',
        '4': 'critical',
    };
    return mapping[stringValue] || 'low'; // low за замовчуванням
};

// API related types
export interface TaskListResponse {
    results: KanbanTask[];
    total: number;
}

export interface CreateTaskPayload {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignee_id?: number;
    tags?: string[];
    due_date?: Date;
    translator_id?: number;
    language_pair_id?: number;
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {
    id: string;
}

// Update status payload
export interface UpdateOrderStatusPayload {
    status_id: string;
}