import {
    Target,
    Clock,
    Eye,
    XCircle,
    PauseCircle,
    CheckSquare
} from 'lucide-react';
import { KanbanColumn } from '../types';

export const COLUMN_STATUSES: KanbanColumn[] = [
    { id: 'planned', title: 'Planned', status: 'planned', order: 1, color: '#3B82F6' },
    { id: 'todo', title: 'To Do', status: 'todo', order: 2, color: '#10B981' },
    { id: 'in_progress', title: 'In Progress', status: 'in_progress', order: 3, color: '#F59E0B' },
    { id: 'pause', title: 'Paused', status: 'pause', order: 4, color: '#8B5CF6' },
    { id: 'reject', title: 'Rejected', status: 'reject', order: 5, color: '#EF4444' },
    { id: 'done', title: 'Done', status: 'done', order: 6, color: '#6B7280' },
];

export const COLUMN_ICONS = {
    planned: Target,
    todo: Clock,
    in_progress: Eye,
    reject: XCircle,
    pause: PauseCircle,
    done: CheckSquare,
};

export const PRIORITY_COLORS = {
    critical: 'bg-red-500',
    high: 'bg-yellow-500',
    medium: 'bg-blue-500',
    low: 'bg-green-500',
};

export const PRIORITY_LABELS = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
};