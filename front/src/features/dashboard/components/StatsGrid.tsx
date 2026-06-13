import { Card } from "@/src/components/ui/card"
import { Users, FolderOpen, Languages, Clock } from "lucide-react"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

interface Stat {
    label: string
    value: string
    change: string
    icon: "users" | "projects" | "translations" | "pending"
}

interface StatsGridProps {
    stats: Stat[]
}

const icons = {
    users: Users,
    projects: FolderOpen,
    translations: Languages,
    pending: Clock,
}

export function StatsGrid({ stats }: StatsGridProps) {
    const { t } = useI18n()

    return (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
                const Icon = icons[stat.icon]
                return (
                    <Card key={index} className="p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm text-muted-foreground truncate">{t(stat.label)}</p>
                                <p className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">{stat.value}</p>
                                <p className="text-xs text-muted-foreground mt-1">{t(stat.change)}</p>
                            </div>
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 ml-2">
                                <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                            </div>
                        </div>
                    </Card>
                )
            })}
        </div>
    )
}
