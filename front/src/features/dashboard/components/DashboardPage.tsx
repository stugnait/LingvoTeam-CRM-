"use client"

import { StatsGrid } from "./StatsGrid"
import { RecentActivity } from "./RecentActivity"
import { QuickActions } from "./QuickActions"
import { useDashboard } from "../hooks/useDashboard"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

export function DashboardPage() {
    const { t } = useI18n()
    const { user, stats } = useDashboard()

    return (
        <div className="space-y-4 sm:space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("common.dashboard")}</h1>
                <p className="text-muted-foreground mt-1">
                    {t("dashboard.welcomeBack", { name: user?.name || t("common.user") })}
                </p>
            </div>

            <StatsGrid stats={stats} />

            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                <RecentActivity />
                <QuickActions />
            </div>
        </div>
    )
}
