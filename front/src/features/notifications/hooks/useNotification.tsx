import { useEffect, useState, useCallback } from "react"
import { notificationsApi } from "../api"
import type { Notification } from "../types"

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const unreadCount = notifications.length

    const fetchUnread = useCallback(async () => {
        try {
            const res = await notificationsApi.unread()
            const items = Array.isArray(res) ? res : (res.results ?? [])
            setNotifications(items)
        } catch (e) {
            console.error("Failed to fetch notifications:", e)
        }
    }, [])

    useEffect(() => {
        fetchUnread()
        const interval = setInterval(fetchUnread, 30_000)
        return () => clearInterval(interval)
    }, [fetchUnread])

    const readNotification = useCallback(async (notification: Notification) => {
        await notificationsApi.read(notification.id)
        setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, [])

    const markAllRead = useCallback(async () => {
        await notificationsApi.markAllRead()
        setNotifications([])
    }, [])

    return {
        notifications,
        unreadCount,
        readNotification,
        markAllRead,
        refetch: fetchUnread,
    }
}