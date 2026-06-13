import { Card } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Plus, Upload, UserPlus, FileText } from "lucide-react"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

const actions = [
    { labelKey: "dashboard.newProject", icon: Plus, variant: "default" as const },
    { labelKey: "dashboard.uploadFile", icon: Upload, variant: "outline" as const },
    { labelKey: "dashboard.addUser", icon: UserPlus, variant: "outline" as const },
    { labelKey: "dashboard.createReport", icon: FileText, variant: "outline" as const },
]

export function QuickActions() {
    const { t } = useI18n()

    return (
        <Card className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">{t("dashboard.quickActions")}</h3>
            <div className="grid grid-cols-2 gap-3">
                {actions.map((action, index) => {
                    const Icon = action.icon
                    return (
                        <Button key={index} variant={action.variant} className="h-auto py-3 sm:py-4 flex-col gap-2">
                            <Icon className="h-5 w-5" />
                            <span className="text-xs sm:text-sm">{t(action.labelKey)}</span>
                        </Button>
                    )
                })}
            </div>
        </Card>
    )
}
