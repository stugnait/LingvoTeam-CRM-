// features/notifications/types.ts
export interface Notification {
    id: number
    title: string
    order: number
    is_read: boolean
    status: 'approved' | 'rejected' | 'pending' // 👈 додай це
}

export type NotificationListResponse = {
    count: number
    results: Notification[]
}
