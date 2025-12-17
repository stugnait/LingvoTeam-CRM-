import type React from "react"
import { CrmSidebar } from "@/src/components/dashboard/crm-sidebar"

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar - persists across navigation */}
            <CrmSidebar />

            {/* Main content area */}
            <div className="flex flex-1 flex-col overflow-hidden pl-64">{children}</div>
        </div>
    )
}
