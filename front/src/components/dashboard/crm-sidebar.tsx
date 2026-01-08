"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Languages, Settings, DollarSign } from "lucide-react"

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Users", href: "/dashboard/users", icon: Users },
    { name: "Translations", href: "/dashboard/translations", icon: Languages },
    { name: "Orders", href: "/dashboard/orders", icon: DollarSign },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function CrmSidebar() {
    const pathname = usePathname()

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-sidebar backdrop-blur-xl">
            <div className="flex h-full flex-col">
                {/* Logo з градієнтом */}
                <div className="flex h-16 items-center border-b border-sidebar-border px-6">
                    <Link href="/dashboard" className="flex items-center gap-3 group">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-soft transition-all duration-300 group-hover:scale-110 group-hover:shadow-soft-lg">
                            <Languages className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-bold text-sidebar-foreground tracking-tight">
                            TranslateCRM
                        </span>
                    </Link>
                </div>

                {/* Navigation з анімаціями */}
                <nav className="flex-1 space-y-1 px-3 py-6">
                    {navigation.map((item, index) => {
                        const isActive = pathname === item.href ||
                            (item.href !== "/dashboard" && pathname.startsWith(item.href))
                        const Icon = item.icon

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`
                                    flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium 
                                    transition-all duration-200 group relative overflow-hidden
                                    animate-slide-up
                                    ${isActive
                                    ? "bg-primary text-white shadow-soft"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                }
                                `}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 opacity-100" />
                                )}
                                <Icon className={`h-5 w-5 relative z-10 transition-transform duration-200 ${
                                    isActive ? "" : "group-hover:scale-110"
                                }`} />
                                <span className="relative z-10">{item.name}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer з покращеним дизайном */}
                <div className="border-t border-sidebar-border p-4 bg-gradient-card">
                    <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors cursor-pointer">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 shadow-soft">
                            <span className="text-sm font-bold text-white">AD</span>
                        </div>
                        <div className="flex-1 text-sm">
                            <p className="font-semibold text-sidebar-foreground">Admin User</p>
                            <p className="text-xs text-muted-foreground">admin@example.com</p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    )
}