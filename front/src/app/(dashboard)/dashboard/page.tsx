import { CrmHeader } from "@/src/components/dashboard/crm-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Users, Languages, CheckCircle2, Clock } from "lucide-react"

export default function DashboardPage() {
    return (
        <>
            <CrmHeader title="Dashboard" />
            <main className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-7xl space-y-6">
                    {/* Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">1,234</div>
                                <p className="text-xs text-muted-foreground">+12% from last month</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Translations</CardTitle>
                                <Languages className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">5,678</div>
                                <p className="text-xs text-muted-foreground">+8% from last month</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">4,892</div>
                                <p className="text-xs text-muted-foreground">86% completion rate</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">786</div>
                                <p className="text-xs text-muted-foreground">14% in progress</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Activity */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    {
                                        user: "John Doe",
                                        action: "completed translation",
                                        project: "Project Alpha",
                                        time: "2 minutes ago",
                                    },
                                    {
                                        user: "Jane Smith",
                                        action: "created new user",
                                        project: "User Management",
                                        time: "15 minutes ago",
                                    },
                                    { user: "Bob Johnson", action: "updated settings", project: "System Config", time: "1 hour ago" },
                                    {
                                        user: "Alice Williams",
                                        action: "assigned translation",
                                        project: "Project Beta",
                                        time: "2 hours ago",
                                    },
                                ].map((activity, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <span className="text-xs font-medium text-muted-foreground">
                        {activity.user
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                      </span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">
                                                <span className="text-foreground">{activity.user}</span>{" "}
                                                <span className="text-muted-foreground">{activity.action}</span>{" "}
                                                <span className="text-foreground">{activity.project}</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    )
}
