import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Plus, Download } from "lucide-react"

const translations = [
    { id: 1, project: "Website Homepage", language: "Spanish", status: "Completed", progress: 100, assignee: "John Doe" },
    { id: 2, project: "Mobile App", language: "French", status: "In Progress", progress: 65, assignee: "Jane Smith" },
    { id: 3, project: "Documentation", language: "German", status: "In Progress", progress: 40, assignee: "Bob Johnson" },
    {
        id: 4,
        project: "Marketing Materials",
        language: "Italian",
        status: "Pending",
        progress: 0,
        assignee: "Unassigned",
    },
    {
        id: 5,
        project: "Product Descriptions",
        language: "Portuguese",
        status: "Completed",
        progress: 100,
        assignee: "Alice Williams",
    },
]

export default function TranslationsPage() {
    return (
        <>
            <DashboardHeader/>
            <main className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-7xl space-y-6">
                    {/* Page Actions */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Translation Projects</h2>
                            <p className="text-muted-foreground">Track and manage all translation projects</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline">
                                <Download className="mr-2 h-4 w-4" />
                                Export
                            </Button>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                New Project
                            </Button>
                        </div>
                    </div>

                    {/* Translations Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>All Projects</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b text-xs uppercase text-muted-foreground">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">
                                            Project
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                            Language
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                            Status
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                            Progress
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                            Assignee
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {translations.map((translation) => (
                                        <tr key={translation.id} className="border-b">
                                            <td className="px-6 py-4 font-medium">{translation.project}</td>
                                            <td className="px-6 py-4">{translation.language}</td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    variant={
                                                        translation.status === "Completed"
                                                            ? "default"
                                                            : translation.status === "In Progress"
                                                                ? "secondary"
                                                                : "outline"
                                                    }
                                                >
                                                    {translation.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                                                        <div className="h-full bg-primary" style={{ width: `${translation.progress}%` }} />
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">{translation.progress}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">{translation.assignee}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    )
}
