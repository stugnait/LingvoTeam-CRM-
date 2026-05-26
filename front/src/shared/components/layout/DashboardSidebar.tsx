"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/src/lib/utils"
import { LayoutDashboard, Users, Languages, Settings, DollarSign, X } from "lucide-react"

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Users", href: "/dashboard/users", icon: Users },
    { name: "Translators", href: "/dashboard/translations", icon: Languages },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
    { name: "Tariffs", href: "/dashboard/tariffs", icon: DollarSign },
]

interface DashboardSidebarProps {
    isOpen?: boolean
    onClose?: () => void
}

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
    const pathname = usePathname()

    const sidebarContent = (
        <>
            <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                        <svg className="h-5 w-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                            />
                        </svg>
                    </div>
                    <span className="text-lg font-semibold">Translation CRM</span>
                </div>
                {/* Close button — тільки на мобільному */}
                <button
                    onClick={onClose}
                    className="lg:hidden p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    aria-label="Close menu"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navigation.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>
        </>
    )

    return (
        <>
            {/* Десктоп: статичний sidebar */}
            <aside className="hidden lg:flex w-64 border-r border-border bg-card flex-col">
                {sidebarContent}
            </aside>

            {/* Мобільний: overlay + drawer */}
            {isOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                        aria-hidden="true"
                    />
                    {/* Drawer */}
                    <aside className="relative z-10 w-72 max-w-[85vw] bg-card flex flex-col h-full shadow-xl animate-in slide-in-from-left duration-200">
                        {sidebarContent}
                    </aside>
                </div>
            )}
        </>
    )
}