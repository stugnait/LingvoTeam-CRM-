import type { OrderListItem } from "@/src/features/orders/types"
import type { KanbanTask } from "@/src/features/editor/types"
import { statusIdToTaskStatus, formatPriority } from "@/src/features/editor/types"

export function mapOrderToTask(order: OrderListItem): KanbanTask {
    return {
        client_comment: "",
        comment: "",
        created_at: "",
        language_pair_id: 0,
        language_pair_name: "",
        manager_name: "",
        source_language: order.source_language || 0,
        status_name: "",
        target_language: order.target_language || 0,
        translator_id: order.translator_id ? String(order.translator_id) : "",
        translator_name: "",

        id: Number(order.id),

        client_name: order.client_name || "",

        title: `Order #${order.id}`,
        description: `${order.source_language} → ${order.target_language}`,

        status_id: String(order.status_id),
        status: statusIdToTaskStatus(String(order.status_id)),

        priority: formatPriority(order.priority),

        deadline: order.deadline,
        client_id: order.client_id,

        assignee: order.translator_id
            ? {
                id: String(order.translator_id),
                name: `Translator #${order.translator_id}`,
            }
            : undefined,

        tags: [],

        subtasks: []
    }
}

function mapStatus(status: string): string {
    switch (status) {
        case "In Progress":
            return "in_progress"
        case "Done":
            return "done"
        case "Pause":
            return "pause"
        case "Planned":
        default:
            return "planned"
    }
}