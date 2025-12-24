"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/src/components/ui/table"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import {
    MoreHorizontal,
    Pencil,
    Trash2,
    UserX,
    UserCheck,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"
import type { User } from "../types"

interface UserTableProps {
    users: User[]
    onEdit: (user: User) => void
    onDelete: (userId: string) => void
    onDeactivate: (user: User) => void
}

export function UserTable({
                              users,
                              onEdit,
                              onDelete,
                              onDeactivate,
                          }: UserTableProps) {
    const getRoleVariant = (slug: string) => {
        const variants: Record<string, "default" | "secondary" | "outline"> = {
            admin: "default",
            manager: "secondary",
            editor: "outline",
            finance: "outline",
        }
        return variants[slug] ?? "outline"
    }

    const getStatusVariant = (isActive: boolean) =>
        isActive ? "default" : "secondary"

    const getStatusLabel = (isActive: boolean) =>
        isActive ? "Active" : "Inactive"

    return (
        <div className="border border-border rounded-lg bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="w-[70px]" />
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell>
                                <div>
                                    <p className="font-medium">
                                        {user.full_name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {user.email}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {user.phone}
                                    </p>
                                </div>
                            </TableCell>

                            <TableCell>
                                <Badge
                                    variant={getRoleVariant(
                                        user.role?.slug || user.role?.name
                                    )}
                                >
                                    {user.role?.name}
                                </Badge>
                            </TableCell>

                            <TableCell>
                                <Badge
                                    variant={getStatusVariant(user.is_active)}
                                >
                                    {getStatusLabel(user.is_active)}
                                </Badge>
                            </TableCell>

                            <TableCell className="text-muted-foreground">
                                {user.date_joined
                                    ? new Date(
                                        user.date_joined
                                    ).toLocaleDateString()
                                    : "—"}
                            </TableCell>

                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            onClick={() => onEdit(user)}
                                        >
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            onClick={() => onDeactivate(user)}
                                        >
                                            {user.is_active ? (
                                                <>
                                                    <UserX className="h-4 w-4 mr-2" />
                                                    Deactivate
                                                </>
                                            ) : (
                                                <>
                                                    <UserCheck className="h-4 w-4 mr-2" />
                                                    Activate
                                                </>
                                            )}
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            onClick={() => onDelete(user.id)}
                                            className="text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
