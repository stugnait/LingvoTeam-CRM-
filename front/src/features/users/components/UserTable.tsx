"use client"

import { useState } from "react"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/src/components/ui/table"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import {
    MoreHorizontal, Pencil, Trash2, UserX, UserCheck, ShieldCheck, KeyRound
} from "lucide-react"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/src/components/ui/dialog"
import type { User } from "../types"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL

export const getImageUrl = (path: string | null | undefined) => {
    if (!path) return undefined
    if (path.startsWith("http")) return path
    const cleanPath = path.startsWith("/") ? path.substring(1) : path
    if (!cleanPath.startsWith("media/")) return `${BACKEND_URL}/media/${cleanPath}`
    return `${BACKEND_URL}/${cleanPath}`
}

// 👇 Той самий об'єкт що й у UsersPage
const ROLE_PERMISSIONS: Record<string, { label: string; perms: string[] }> = {
    admin: { label: "Admin", perms: [
            "Перегляд та редагування всіх замовлень",
            "Управління користувачами (створення, редагування, видалення)",
            "Доступ до статистики та дашборду",
            "Управління клієнтами та категоріями",
            "Перегляд тарифів та фінансів",
            "Доступ до P&L звіту",
            "Управління перекладачами",
        ]},
    manager: { label: "Manager", perms: [
            "Перегляд та ведення своїх замовлень",
            "Робота з клієнтами та категоріями",
            "Перегляд перекладачів",
            "Перегляд зарплат менеджерів",
            "Доступ до дашборду",
        ]},
    editor: { label: "Editor", perms: [
            "Перегляд своїх завдань (Tasks)",
            "Редагування та перевірка замовлень",
            "Перегляд свого профілю",
        ]},
    finance: { label: "Finance", perms: [
            "Перегляд фінансового дашборду",
            "Доступ до P&L звіту",
            "Перегляд тарифів та статистики",
            "Аналітика клієнтів та команди",
        ]},
}

interface UserTableProps {
    users: User[]
    onEdit: (user: User) => void
    onDelete: (userId: string) => void
    onDeactivate: (user: User) => void
    page: number
    totalPages: number
    onPageChange: (page: number) => void
    onResetPassword: (userId: string) => void
}

export function UserTable({
                              users, onEdit, onDelete, onDeactivate, page, totalPages, onPageChange, onResetPassword
                          }: UserTableProps) {
    // 👇 Стан для модалки дозволів
    const [permUser, setPermUser] = useState<User | null>(null)

    const getRoleVariant = (slug: string) => {
        const variants: Record<string, "default" | "secondary" | "outline"> = {
            admin: "default", manager: "secondary", editor: "outline", finance: "outline",
        }
        return variants[slug] ?? "outline"
    }

    const getStatusVariant = (isActive: boolean) => isActive ? "default" : "secondary"
    const getStatusLabel  = (isActive: boolean) => isActive ? "Active" : "Inactive"

    return (
        <>
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
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold overflow-hidden border">
                                            {user.avatar ? (
                                                <img
                                                    src={getImageUrl(user.avatar)}
                                                    alt={user.full_name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <span>{user.full_name?.charAt(0).toUpperCase() || "?"}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium">{user.full_name}</p>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                            <p className="text-sm text-muted-foreground">{user.phone}</p>
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <Badge variant={getRoleVariant(user.role?.slug || user.role?.name)}>
                                        {user.role?.name}
                                    </Badge>
                                </TableCell>

                                <TableCell>
                                    <Badge variant={getStatusVariant(user.is_active)}>
                                        {getStatusLabel(user.is_active)}
                                    </Badge>
                                </TableCell>

                                <TableCell className="text-muted-foreground">
                                    {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : "—"}
                                </TableCell>

                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent align="end">
                                            {/* 👇 Нова кнопка */}
                                            <DropdownMenuItem onClick={() => setPermUser(user)}>
                                                <ShieldCheck className="h-4 w-4 mr-2" />
                                                View permissions
                                            </DropdownMenuItem>

                                            <DropdownMenuItem onClick={() => onResetPassword(user.id)}>
                                                <KeyRound className="h-4 w-4 mr-2" />
                                                Reset password
                                            </DropdownMenuItem>

                                            <DropdownMenuItem onClick={() => onEdit(user)}>
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>

                                            <DropdownMenuItem onClick={() => onDeactivate(user)}>
                                                {user.is_active ? (
                                                    <><UserX className="h-4 w-4 mr-2" />Deactivate</>
                                                ) : (
                                                    <><UserCheck className="h-4 w-4 mr-2" />Activate</>
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

                <div className="flex items-center justify-center gap-2 py-4 border-t bg-muted/20">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
                        Previous
                    </Button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <Button
                                key={i + 1} size="sm"
                                variant={page === i + 1 ? "default" : "outline"}
                                onClick={() => onPageChange(i + 1)}
                                className="w-9"
                            >
                                {i + 1}
                            </Button>
                        ))}
                    </div>
                    <Button variant="outline" size="sm" disabled={page === totalPages || totalPages === 0} onClick={() => onPageChange(page + 1)}>
                        Next
                    </Button>
                </div>
            </div>

            {/* 👇 Модалка дозволів */}
            <Dialog open={!!permUser} onOpenChange={(open) => !open && setPermUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                            {permUser?.full_name} — {permUser?.role?.name}
                        </DialogTitle>
                    </DialogHeader>

                    <ul className="space-y-2 mt-2">
                        {(ROLE_PERMISSIONS[permUser?.role?.slug ?? ""]?.perms ?? []).map((perm, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                                <span className="text-green-500 mt-0.5">✓</span>
                                {perm}
                            </li>
                        ))}

                        {/* Якщо роль невідома */}
                        {!ROLE_PERMISSIONS[permUser?.role?.slug ?? ""] && (
                            <li className="text-sm text-muted-foreground">
                                Дозволи для цієї ролі не визначені.
                            </li>
                        )}
                    </ul>
                </DialogContent>
            </Dialog>
        </>
    )
}