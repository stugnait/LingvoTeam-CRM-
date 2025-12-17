"use client"

import { StatsGrid } from "./StatsGrid"
import { RecentActivity } from "./RecentActivity"
import { QuickActions } from "./QuickActions"
import { useDashboard } from "../hooks/useDashboard"

export function DashboardPage() {
    const { user, stats } = useDashboard()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground mt-1">Welcome back, {user?.name || "User"}</p>
            </div>

            <StatsGrid stats={stats} />

            <div className="grid gap-6 lg:grid-cols-2">
                <RecentActivity />
                <QuickActions />
            </div>
        </div>
    )
}
