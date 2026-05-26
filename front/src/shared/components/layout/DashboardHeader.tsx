"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/src/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"
import { User, LogOut, Menu } from "lucide-react"
import { useToast } from "@/src/hooks/use-toast"
// shared/layout/DashboardHeader.tsx
import { NotificationsDropdown } from "@/src/features/notifications/components/NotificationsDropdown"

interface DashboardHeaderProps {
    onMenuClick?: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
    const router = useRouter()
    const { toast } = useToast()

    const handleLogout = () => {
        toast({
            title: "Signed out",
            description: "You have been successfully signed out.",
        })
        router.push("/login")
    }

    const handleProfile = () => {
        router.push("/dashboard/profile")
    }

    return (
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 sm:px-6">
            {/* Ліва частина — додано pl-12 для мобілок, щоб звільнити місце під fixed бургер */}
            <div className="flex items-center gap-3 min-w-0 pl-12 lg:pl-0">
                {onMenuClick && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onMenuClick}
                        className="lg:hidden shrink-0"
                        aria-label="Open menu"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                )}
                <h2 className="text-lg font-semibold truncate">CRM Dashboard</h2>
            </div>

            {/* Права частина */}
            <div className="flex items-center gap-2 shrink-0">
                <NotificationsDropdown />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:scale-105 transition-all duration-200 shrink-0"
                        >
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 shadow-soft">
                                <span className="text-xs font-bold text-white">AD</span>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={handleProfile}>
                            <User className="h-4 w-4 mr-2" />
                            Profile
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            onClick={handleLogout}
                            className="text-destructive"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}