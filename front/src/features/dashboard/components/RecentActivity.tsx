import { Card } from "@/src/components/ui/card"

const activities = [
    { user: "Sarah Johnson", action: "created new project", target: "Website Localization", time: "2 hours ago" },
    { user: "Mike Chen", action: "completed translation", target: "Marketing Content", time: "4 hours ago" },
    { user: "Emma Davis", action: "updated user role", target: "John Smith", time: "5 hours ago" },
    { user: "Alex Kumar", action: "uploaded document", target: "Product Guide", time: "1 day ago" },
]

export function RecentActivity() {
    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
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
                                <span className="text-muted-foreground">{activity.action}</span>{" "}
                                <span className="font-medium">{activity.target}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    )
}
