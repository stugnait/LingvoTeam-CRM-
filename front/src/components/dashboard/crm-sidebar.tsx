"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMe } from "@/src/features/auth/hooks/useMe"
import {
    LayoutDashboard,
    FileText,
    DollarSign,
    Languages,
    Users,
    UserCog,
    User,
    CheckSquare,
    ChevronLeft,
} from "lucide-react"

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "editor"] },
    { name: "Orders", href: "/dashboard/orders", icon: FileText, roles: ["admin", "manager"] },
    { name: "Tariffs", href: "/dashboard/tariffs", icon: DollarSign, roles: ["admin", "financier"] },
    { name: "Translators", href: "/dashboard/translations", icon: Languages, roles: ["admin", "manager"] },
    { name: "Clients", href: "/dashboard/clients", icon: Users, roles: ["admin", "manager"] },
    { name: "Users", href: "/dashboard/users", icon: UserCog, roles: ["admin"] },
    { name: "Profile", href: "/dashboard/profile", icon: User, roles: ["admin", "editor"] },
    { name: "Tasks", href: "/dashboard/editor", icon: CheckSquare, roles: ["editor"] },
    { name: "P&L", href: "/dashboard/p&l", icon: CheckSquare, roles: ["financier"] },
    { name: "Client-Categories", href: "/dashboard/client-categories", icon: CheckSquare, roles: ["admin", "manager"] },
]

export function CrmSidebar({
                               collapsed,
                               toggle,
                           }: {
    collapsed: boolean
    toggle: () => void
}) {
    const pathname = usePathname()
    const { role, loading } = useMe()

    if (loading || !role) {return null}

    const filteredNavigation = navigation.filter(item =>
        item.roles.includes(role)
    )

    return (
        <>
            {/* САЙДБАР */}
            <aside
                className={`
                    fixed left-0 top-0 z-40 h-screen w-64 border-r bg-sidebar
                    transition-transform duration-300 ease-in-out
                    ${collapsed ? "-translate-x-full" : "translate-x-0"}
                `}
            >
                <div className="flex h-full flex-col">
                    {/* Logo */}
                    <div className="flex h-16 items-center border-b px-6">
                        <Link href="/dashboard" className="flex items-center gap-3">
                            <Languages className="h-5 w-5"/>
                            <span className="font-bold">TranslateCRM</span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1 px-3 py-6">
                        {filteredNavigation.map((item) => {
                            const Icon = item.icon

                            const isActive =
                                pathname === item.href ||
                                (item.href !== "/dashboard" &&
                                    pathname.startsWith(item.href))

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`
                                        flex items-center gap-3 rounded-lg px-4 py-3 text-sm
                                        transition-colors
                                        ${
                                        isActive
                                            ? "bg-primary text-white"
                                            : "hover:bg-muted"
                                    }
                                    `}
                                >
                                    <Icon className="h-4 w-4"/>
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="border-t p-4 text-sm">
                        Role: <b>{role}</b>
                    </div>
                </div>
            </aside>

            {/* КНОПКА - тепер окремо від сайдбару */}
            <button
                onClick={toggle}
                style={{
                    left: collapsed ? 0 : 256,
                }}
                className="
                    fixed top-1/2 -translate-y-1/2 z-50
                    flex items-center justify-center
                    h-10 w-6
                    rounded-r-full rounded-l-none
                    bg-primary text-white
                    shadow-lg
                    hover:w-10
                    transition-all duration-300
                    group
                    cursor-pointer
                "
            >
                <ChevronLeft
                    className={`
                        h-4 w-4
                        transition-all duration-300
                        ${collapsed ? "rotate-180" : ""}
                        group-hover:scale-110
                    `}
                />
            </button>
        </>
    )
}