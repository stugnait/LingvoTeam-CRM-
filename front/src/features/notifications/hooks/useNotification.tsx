import { useEffect, useState } from "react"
import { notificationsApi } from "../api"
import type { Notification } from "../types"

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const unreadCount = notifications.length

    useEffect(() => {
        notificationsApi.unread()
            .then(res => setNotifications(res.results))
            .catch(() => {})
    }, [])

    const readNotification = async (notification: Notification) => {
        await notificationsApi.read(notification.id)
        setNotifications(prev =>
            prev.filter(n => n.id !== notification.id)
        )
    }

    const markAllRead = async () => {
        await notificationsApi.markAllRead()
        setNotifications([])
    }

    return {
        notifications,
        unreadCount,
        readNotification,
        markAllRead,
    }
}
