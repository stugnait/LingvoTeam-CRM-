import { Card } from "@/components/ui/card"
import { Users, FolderOpen, Languages, Clock } from "lucide-react"

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
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
                const Icon = icons[stat.icon]
                return (
                    <Card key={index} className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground">{stat.label}</p>
                                <p className="text-2xl font-bold mt-2">{stat.value}</p>
                                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Icon className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </Card>
                )
            })}
        </div>
    )
}
