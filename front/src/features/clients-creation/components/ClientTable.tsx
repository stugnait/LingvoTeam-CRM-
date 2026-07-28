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
} from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"

import type { Client } from "../types"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

interface ClientTableProps {
    clients: (Client & { category_name?: string; discount_percent?: number })[]
    onEdit: (client: Client) => void
    onDelete: (client: Client) => void
    page: number
    totalPages: number
    onPageChange: (page: number) => void
}

export function ClientTable({
                                clients,
                                onEdit,
                                onDelete,
                                page,
                                totalPages,
                                onPageChange
                            }: ClientTableProps) {
    const { t } = useI18n()

    return (
        <div className="border border-border rounded-lg bg-card">

            {/* Desktop таблиця */}
            <div className="hidden sm:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("common.client")}</TableHead>
                            <TableHead>{t("orders.category")}</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead className="w-[70px]" />
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {clients.map((client) => (
                            <TableRow key={client.id}>
                                <TableCell className="font-medium">
                                    {client.full_name}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={client.category ? "secondary" : "outline"}>
                                            {client.category ? client.category_name : t("orders.noCategory")}
                                        </Badge>
                                        {client.category && client.discount_percent !== null && (
                                            <Badge variant="outline" className="text-xs text-muted-foreground">
                                                -{client.discount_percent}%
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                {/* ЗМІНЕНО: Вивід масиву емейлів */}
                                <TableCell>
                                    {client.emails && client.emails.length > 0
                                        ? client.emails.join(", ")
                                        : "—"}
                                </TableCell>
                                <TableCell>{client.phone_number || "—"}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <MoreHorizontal className="h-4 w-4"/>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onEdit(client)}>
                                                <Pencil className="h-4 w-4 mr-2"/>
                                                {t("common.edit")}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onDelete(client)} className="text-destructive">
                                                <Trash2 className="h-4 w-4 mr-2"/>
                                                {t("common.delete")}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Мобільні картки */}
            <div className="sm:hidden divide-y divide-border">
                {clients.map((client) => (
                    <div key={client.id} className="flex items-center justify-between px-4 py-3 gap-3">
                        <div className="min-w-0 space-y-1">
                            <p className="font-medium text-sm truncate">{client.full_name}</p>
                            {/* ЗМІНЕНО: Вивід масиву емейлів для мобілки */}
                            <p className="text-xs text-muted-foreground truncate">
                                {client.emails && client.emails.length > 0
                                    ? client.emails.join(", ")
                                    : "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">{client.phone_number || "—"}</p>
                            <div className="flex items-center gap-1 flex-wrap">
                                <Badge variant={client.category ? "secondary" : "outline"} className="text-xs">
                                    {client.category ? client.category_name : t("orders.noCategory")}
                                </Badge>
                                {client.category && client.discount_percent !== null && (
                                    <Badge variant="outline" className="text-xs text-muted-foreground">
                                        -{client.discount_percent}%
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="shrink-0">
                                    <MoreHorizontal className="h-4 w-4"/>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEdit(client)}>
                                    <Pencil className="h-4 w-4 mr-2"/>
                                    {t("common.edit")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDelete(client)} className="text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2"/>
                                    {t("common.delete")}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ))}
            </div>

            {/* Пагінація — без змін */}
            <div className="flex items-center justify-center gap-2 py-4 border-t bg-muted/20">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => onPageChange(page - 1)}
                >
                    {t("common.back")}
                </Button>

                <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => (
                        <Button
                            key={i + 1}
                            size="sm"
                            variant={page === i + 1 ? "default" : "outline"}
                            onClick={() => onPageChange(i + 1)}
                            className="w-9"
                        >
                            {i + 1}
                        </Button>
                    ))}
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages || totalPages === 0}
                    onClick={() => onPageChange(page + 1)}
                >
                    {t("common.next")}
                </Button>
            </div>
        </div>
    )
}