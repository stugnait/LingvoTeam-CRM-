"use client"

import { useState, Suspense } from "react"
import { CrmSidebar } from "@/src/components/dashboard/crm-sidebar"
import { cn } from "@/src/lib/utils"

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode
}) {
    const [collapsed, setCollapsed] = useState(false)

    return (
        <div className="flex min-h-screen bg-background">
            <Suspense fallback={<div className={collapsed ? "w-20" : "w-64"} />}>
                <CrmSidebar
                    collapsed={collapsed}
                    toggle={() => setCollapsed(prev => !prev)}
                />
            </Suspense>

            <div
                className={cn(
                    "flex flex-col flex-1 min-w-0 transition-all duration-300 ease-in-out",
                    collapsed ? "lg:ml-20" : "lg:ml-64", // Відступ для контенту
                    "ml-0"
                )}
            >

                <main className="flex-1 flex flex-col">
                    {children}
                </main>
            </div>
        </div>
    )
}