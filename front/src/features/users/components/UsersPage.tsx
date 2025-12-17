"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { UserTable } from "./UserTable"
import { UserFilters } from "./UserFilters"
import { useUsers } from "../hooks/useUsers"

export function UsersPage() {
    const { users, filters, setFilters, handleAddUser, handleEditUser, handleDeleteUser } = useUsers()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Users</h1>
                    <p className="text-muted-foreground mt-1">Manage user accounts and permissions</p>
                </div>
                <Button onClick={handleAddUser}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                </Button>
            </div>

            <UserFilters filters={filters} setFilters={setFilters} />
            <UserTable users={users} onEdit={handleEditUser} onDelete={handleDeleteUser} />
        </div>
    )
}
