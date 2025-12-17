"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Languages, Settings } from "lucide-react"

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Users", href: "/dashboard/users", icon: Users },
    { name: "Translations", href: "/dashboard/translations", icon: Languages },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function CrmSidebar() {
    const pathname = usePathname()

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-sidebar">
            <div className="flex h-full flex-col">
                {/* Logo */}
                <div className="flex h-16 items-center border-b border-sidebar-border px-6">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                            <span className="text-sm font-semibold text-primary-foreground">TC</span>
                        </div>
                        <span className="text-lg font-semibold text-sidebar-foreground">Translation CRM</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 px-3 py-4">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                        const Icon = item.icon

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                    isActive
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                                }`}
                            >
                                <Icon className="h-5 w-5" />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer */}
                <div className="border-t border-sidebar-border p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            <span className="text-xs font-medium text-muted-foreground">AD</span>
                        </div>
                        <div className="flex-1 text-sm">
                            <p className="font-medium text-sidebar-foreground">Admin User</p>
                            <p className="text-xs text-muted-foreground">admin@example.com</p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    )
}
