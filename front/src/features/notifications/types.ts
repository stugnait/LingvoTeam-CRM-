// features/notifications/types.ts
export type Notification = {
    id: number
    title: string
    order: number
    is_read: boolean
    created_at: string
}

export type NotificationListResponse = {
    count: number
    results: Notification[]
}
