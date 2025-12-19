import { Card } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Plus, Upload, UserPlus, FileText } from "lucide-react"

const actions = [
    { label: "New Project", icon: Plus, variant: "default" as const },
    { label: "Upload File", icon: Upload, variant: "outline" as const },
    { label: "Add User", icon: UserPlus, variant: "outline" as const },
    { label: "Create Report", icon: FileText, variant: "outline" as const },
]

export function QuickActions() {
    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
                {actions.map((action, index) => {
                    const Icon = action.icon
                    return (
                        <Button key={index} variant={action.variant} className="h-auto py-4 flex-col gap-2">
                            <Icon className="h-5 w-5" />
                            <span className="text-sm">{action.label}</span>
                        </Button>
                    )
                })}
            </div>
        </Card>
    )
}
