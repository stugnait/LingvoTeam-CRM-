"use client"

import { useState } from "react"
import { CrmSidebar } from "@/src/components/dashboard/crm-sidebar"

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode
}) {
    const [collapsed, setCollapsed] = useState(false)

    return (
        <div className="flex">
            {/* SIDEBAR */}
            <CrmSidebar
                collapsed={collapsed}
                toggle={() => setCollapsed(prev => !prev)}
            />

            {/* CONTENT */}
            <main
                className={`
                    w-full min-h-screen
                    transition-all duration-300 ease-in-out
                    ${collapsed ? "ml-0" : "ml-64"}
                `}
            >
                {children}
            </main>
        </div>
    )
}