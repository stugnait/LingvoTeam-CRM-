// /types/kanban.ts
export type TaskStatus = 'planned' | 'todo' | 'in_progress' | 'reject' | 'pause' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface KanbanTask {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignee?: {
        id: string;
        name: string;
        avatar?: string;
    };
    tags: string[];
    dueDate?: Date;
}

export interface KanbanColumn {
    id: string;
    title: string;
    status: TaskStatus;
    taskIds: string[];
    color: string;
    icon: React.ReactNode;
}

// For API responses (like your order example)
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