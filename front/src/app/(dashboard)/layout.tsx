"use client"

import { useState, Suspense } from "react" // Додали Suspense
import { CrmSidebar } from "@/src/components/dashboard/crm-sidebar"

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode
}) {
    const [collapsed, setCollapsed] = useState(false)

    return (
        <div className="flex">
            <Suspense fallback={<div className={collapsed ? "w-0" : "w-64"} />}>
                <CrmSidebar
                    collapsed={collapsed}
                    toggle={() => setCollapsed(prev => !prev)}
                />
            </Suspense>

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