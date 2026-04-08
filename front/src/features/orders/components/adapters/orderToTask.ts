import type { OrderListItem } from "@/src/features/orders/types"
import {KanbanTask, statusIdToTaskStatus} from "@/src/features/editor/types"

export function mapOrderToTask(order: OrderListItem): KanbanTask {
    return {
        client_comment: "",
        comment: "",
        created_at: "",
        language_pair_id: 0,
        language_pair_name: "",
        manager_name: "",
        source_language: 0,
        status_name: "",
        target_language: 0,
        translator_id: "",
        translator_name: "",
        id: String(order.id),

        title: `Order #${order.id}`,
        description: `${order.source_language} → ${order.target_language}`,

        status: statusIdToTaskStatus(order.status_id),
        status_id: order.status_id,

        priority: order.priority,

        deadline: order.deadline,
        client_id: order.client_id,

        assignee: order.translator_id
            ? {
                id: order.translator_id,
                name: `Translator #${order.translator_id}`,
            }
            : null,

        tags: [],
        subtasks: [] // 🔥 must have
    }
}

function mapStatus(status: string): KanbanTask["status"] {
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