"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Languages } from "lucide-react"
import { useMe } from "@/src/features/auth/hooks/useMe"

const navigation = [
    {
        name: "Dashboard",
        href: "/dashboard",
        roles: ["admin", "manager"],
    },
    {
        name: "Orders",
        href: "/dashboard/orders",
        roles: ["admin", "manager"],
    },
    {
        name: "Tariffs",
        href: "/dashboard/tariffs",
        roles: ["admin"],
    },
    {
        name: "Translators",
        href: "/dashboard/translations",
        roles: ["admin", "manager"],
    },
    {
        name: "Clients",
        href: "/dashboard/clients",
        roles: ["admin", "manager"],
    },
    {
        name: "Users",
        href: "/dashboard/users",
        roles: ["admin"],
    },
    {
        name: "Profile",
        href: "/dashboard/profile",
        roles: ["admin", "editor"],
    },
    {
        name: "Tasks",
        href: "/dashboard/editor",
        roles: ["editor"],
    },


]

export function CrmSidebar() {
    const pathname = usePathname()
    const { role, loading } = useMe()

    // ⛔ не рендеримо sidebar, поки не знаємо роль
    if (loading || !role) {return null}

    const filteredNavigation = navigation.filter(item =>
        item.roles.includes(role)
    )

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-sidebar">
            <div className="flex h-full flex-col">

                {/* Logo */}
                <div className="flex h-16 items-center border-b px-6">
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <Languages className="h-5 w-5" />
                        <span className="font-bold">TranslateCRM</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 px-3 py-6">
                    {filteredNavigation.map((item) => {
                        const isActive =
                            pathname === item.href ||
                            (item.href !== "/dashboard" &&
                                pathname.startsWith(item.href))

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`block rounded-lg px-4 py-3 text-sm
                  ${isActive ? "bg-primary text-white" : "hover:bg-muted"}
                `}
                            >
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
    )
}
