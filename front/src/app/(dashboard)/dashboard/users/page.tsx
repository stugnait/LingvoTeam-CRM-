import { CrmHeader } from "@/src/components/dashboard/crm-header"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Plus, MoreVertical } from "lucide-react"

const users = [
    { id: 1, name: "John Doe", email: "john@example.com", role: "Admin", status: "Active" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "Manager", status: "Active" },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", role: "Editor", status: "Active" },
    { id: 4, name: "Alice Williams", email: "alice@example.com", role: "Finance", status: "Inactive" },
    { id: 5, name: "Charlie Brown", email: "charlie@example.com", role: "Editor", status: "Active" },
]

export default function UsersPage() {
    return (
        <>
            <CrmHeader title="Users" />
            <main className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-7xl space-y-6">
                    {/* Page Actions */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
                            <p className="text-muted-foreground">Manage your team members and their permissions</p>
                        </div>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    </div>

                    {/* Users Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>All Users</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b text-xs uppercase text-muted-foreground">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">
                                            Name
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                            Email
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                            Role
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                            Status
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                            Actions
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className="border-b">
                                            <td className="px-6 py-4 font-medium">{user.name}</td>
                                            <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant="secondary">{user.role}</Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={user.status === "Active" ? "default" : "outline"}>{user.status}</Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </td>
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
