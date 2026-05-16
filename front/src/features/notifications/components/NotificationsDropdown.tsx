// features/notifications/components/NotificationsDropdown.tsx
"use client"

import { Bell, CheckCircle, XCircle, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu"
import { Button } from "@/src/components/ui/button"
import { useNotifications } from "../hooks/useNotification"

const STATUS_CONFIG = {
    approved: {
        icon: CheckCircle,
        iconClass: "text-green-500",
        borderClass: "border-l-2 border-green-500",
        bgClass: "bg-green-50 dark:bg-green-950/20",
    },
    rejected: {
        icon: XCircle,
        iconClass: "text-red-500",
        borderClass: "border-l-2 border-red-500",
        bgClass: "bg-red-50 dark:bg-red-950/20",
    },
    pending: {
        icon: Clock,
        iconClass: "text-muted-foreground",
        borderClass: "border-l-2 border-muted",
        bgClass: "",
    },
}

export function NotificationsDropdown() {
    const router = useRouter()
    const { notifications, unreadCount, readNotification, markAllRead } = useNotifications()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80">
                {notifications.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                        No new notifications
                    </div>
                ) : (
                    notifications.map(n => {
                        const config = STATUS_CONFIG[n.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
                        const Icon = config.icon

                        return (
                            <DropdownMenuItem
                                key={n.id}
                                onClick={async () => {
                                    await readNotification(n)
                                    router.push(`/dashboard/orders?highlight=${n.order}`)
                                }}
                                className={`flex items-start gap-3 px-3 py-2 ${config.borderClass} ${config.bgClass} ${!n.is_read ? "font-medium" : "opacity-70"}`}
                            >
                                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${config.iconClass}`} />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm leading-tight">{n.title}</span>
                                    <span className="text-xs text-muted-foreground mt-0.5">
                                        Order #{n.order}
                                    </span>
                                </div>
                                {!n.is_read && (
                                    <span className="ml-auto h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                                )}
                            </DropdownMenuItem>
                        )
                    })
                )}

                {notifications.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={markAllRead} className="justify-center text-sm text-muted-foreground">
                            Mark all as read
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}