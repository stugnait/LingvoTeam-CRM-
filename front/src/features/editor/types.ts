// /types/kanban.ts
import React from 'react';

export type TaskStatus =
    | 'planned'
    | 'todo'
    | 'in_progress'
    | 'reject'
    | 'pause'
    | 'done'
    | 'in_translation'
    | 'in_checking'
    | 'revision';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface OrderListItem {
    editor_name: string;
    id: number;
    client_id: number;
    source_language: number;
    target_language: number;
    status_id: number;
    status_name: string;
    created_at: string;
    translator_id: number;
    language_pair_id: number;
    client_name: string;
    deadline: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    manager_accept_id?: number;
    manager_accept_name?: string;
    manager_delivery_id?: number;
    manager_delivery_name?: string;
    manager_avatar?: string | null;
    translator_avatar?: string | null;
    language_pair_name?: string;
    client_comment?: string;
    translator_name?: string;
    manager_name?: string;
    status?: string;
    // поля які реально приходять з API для editor
    editor_status_id?: number;
    editor_status?: number | { id: number };
}

export interface OrderListResponse {
    results: OrderListItem[];
    total: number;
}

export interface KanbanTask extends Omit<OrderListItem, 'id'> {
    id: string;
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
    status: TaskStatus;      // людська назва: 'planned', 'todo', ...
    editor_status: string;   // ID з бекенду: '1', '5', '8', '11', ...
    taskIds: string[];
    color: string;
    icon: React.ReactNode;
}

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

export const formatPriority = (priorityValue: string | number): TaskPriority => {
    const stringValue = String(priorityValue);
    const mapping: Record<string, TaskPriority> = {
        '1': 'low',
        '2': 'medium',
        '3': 'high',
        '4': 'critical',
    };
    return mapping[stringValue] || (
        ['low', 'medium', 'high', 'critical'].includes(stringValue)
            ? stringValue as TaskPriority
            : 'low'
    );
};

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

export interface UpdateOrderStatusPayload {
    status_id: string;
}