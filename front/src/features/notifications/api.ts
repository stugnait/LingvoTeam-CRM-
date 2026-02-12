// features/notifications/api.ts
import { apiFetch } from "@/src/shared/api/client"
import type { NotificationListResponse } from "./types"

export const notificationsApi = {
    unread: () =>
        apiFetch<NotificationListResponse>("notifications/unread/", {
            method: "GET",
        }),

    read: (id: number) =>
        apiFetch(`notifications/${id}/read/`, {
            method: "POST",
        }),

    markAllRead: () =>
        apiFetch("notifications/mark_all_read/", {
            method: "POST",
        }),
}
