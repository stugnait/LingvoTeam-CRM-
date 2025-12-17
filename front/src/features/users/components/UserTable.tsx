"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface User {
    id: string
    name: string
    email: string
    role: string
    status: string
    joinDate: string
}

interface UserTableProps {
    users: User[]
    onEdit: (user: User) => void
    onDelete: (userId: string) => void
}

export function UserTable({ users, onEdit, onDelete }: UserTableProps) {
    const getStatusVariant = (status: string) => {
        return status === "Active" ? "default" : "secondary"
    }

    const getRoleVariant = (role: string) => {
        const variants: Record<string, "default" | "secondary" | "outline"> = {
            Admin: "default",
            Manager: "secondary",
            Editor: "outline",
            Finance: "outline",
        }
        return variants[role] || "outline"
    }

    return (
        <div className="border border-border rounded-lg bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell>
                                <div>
                                    <p className="font-medium">{user.name}</p>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={getRoleVariant(user.role)}>{user.role}</Badge>
                            </TableCell>
                            <TableCell>
                                <Badge variant={getStatusVariant(user.status)}>{user.status}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{new Date(user.joinDate).toLocaleDateString()}</TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onEdit(user)}>
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onDelete(user.id)} className="text-destructive">
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
