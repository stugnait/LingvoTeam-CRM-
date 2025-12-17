"use client"

import type { ReactNode } from "react"
import { DashboardSidebar } from "./DashboardSidebar"
import { DashboardHeader } from "./DashboardHeader"

interface DashboardLayoutProps {
    children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="min-h-screen flex bg-background">
            <DashboardSidebar />
            <div className="flex-1 flex flex-col">
                <DashboardHeader />
                <main className="flex-1 p-6 lg:p-8">{children}</main>
            </div>
        </div>
    )
}
