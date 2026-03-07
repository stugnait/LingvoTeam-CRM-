// features/notifications/components/NotificationsDropdown.tsx
"use client"

import { Bell } from "lucide-react"
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

export function NotificationsDropdown() {
    const router = useRouter()
    const {
        notifications,
        unreadCount,
        readNotification,
        markAllRead,
    } = useNotifications()

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
                    notifications.map(n => (
                        <DropdownMenuItem
                            key={n.id}
                            onClick={async () => {
                                await readNotification(n)
                                router.push(`/dashboard/orders?highlight=${n.order}`)
                            }}
                            className="flex flex-col items-start"
                        >
                            <span className="font-medium">{n.title}</span>
                            <span className="text-xs text-muted-foreground">
                                Order #{n.id}
                            </span>
                        </DropdownMenuItem>
                    ))
                )}

                {notifications.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={markAllRead}>
                            Mark all as read
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
