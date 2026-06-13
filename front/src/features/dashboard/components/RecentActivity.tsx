import { Card } from "@/src/components/ui/card"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

const activities = [
    { user: "Sarah Johnson", actionKey: "dashboard.createdProject", target: "Website Localization", timeKey: "dashboard.twoHoursAgo" },
    { user: "Mike Chen", actionKey: "dashboard.completedTranslation", target: "Marketing Content", timeKey: "dashboard.fourHoursAgo" },
    { user: "Emma Davis", actionKey: "dashboard.updatedUserRole", target: "John Smith", timeKey: "dashboard.fiveHoursAgo" },
    { user: "Alex Kumar", actionKey: "dashboard.uploadedDocument", target: "Product Guide", timeKey: "dashboard.oneDayAgo" },
]

export function RecentActivity() {
    const { t } = useI18n()

    return (
        <Card className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">{t("dashboard.recentActivity")}</h3>
            <div className="space-y-4">
                {activities.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-primary">
                                {activity.user
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm">
                                <span className="font-medium">{activity.user}</span>{" "}
                                <span className="text-muted-foreground">{t(activity.actionKey)}</span>{" "}
                                <span className="font-medium">{activity.target}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{t(activity.timeKey)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    )
}
