"use client"

import { Input } from "@/src/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Search } from "lucide-react"
import type { UsersFilters } from "../types"

// interface Filters {
//     search: string
//     role: string
//     status: string
// }

interface UserFiltersProps {
    filters: UsersFilters
    setFilters: (filters: UsersFilters) => void
}

export function UserFilters({ filters, setFilters }: UserFiltersProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search users..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-9"
                />
            </div>
            <Select
                value={filters.role}
                onValueChange={(value) =>
                    setFilters({ ...filters, role: value })
                }
            >
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                </SelectContent>
            </Select>
            <Select
                value={
                    filters.status === null
                        ? "all"
                        : filters.status
                            ? "active"
                            : "inactive"
                }
                onValueChange={(value) =>
                    setFilters({
                        ...filters,
                        status:
                            value === "all"
                                ? null
                                : value === "active",
                    })
                }
            >
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
            </Select>


        </div>
    )
}
