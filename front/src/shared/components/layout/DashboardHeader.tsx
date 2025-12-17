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
import { Bell, User, LogOut } from "lucide-react"
import { useToast } from "@/src/hooks/use-toast"

export function DashboardHeader() {
    const router = useRouter()
    const { toast } = useToast()

    const handleLogout = () => {
        localStorage.removeItem("currentUser")
        toast({
            title: "Signed out",
            description: "You have been successfully signed out.",
        })
        router.push("/login")
    }

    return (
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold">CRM Dashboard</h2>
            </div>

            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                    <Bell className="h-5 w-5" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                            <User className="h-4 w-4 mr-2" />
                            Profile Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
