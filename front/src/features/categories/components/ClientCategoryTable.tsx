"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/src/components/ui/table"
import { Button } from "@/src/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import type { ClientCategory } from "../types"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

interface ClientCategoryTableProps {
    categories: ClientCategory[]
    onEdit: (category: ClientCategory) => void
    onDelete: (category: ClientCategory) => void
}

export function ClientCategoryTable({
                                        categories,
                                        onEdit,
                                        onDelete,
                                    }: ClientCategoryTableProps) {
    const { t } = useI18n()

    return (
        <>
            <div className="hidden sm:block border border-border rounded-lg bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("common.name")}</TableHead>
                            <TableHead>{t("common.discount")}</TableHead>
                            <TableHead className="w-[70px]" />
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {categories.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={3}
                                    className="text-center text-muted-foreground py-6"
                                >
                                    {t("clients.noCategories")}
                                </TableCell>
                            </TableRow>
                        ) : (
                            categories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell className="font-medium">
                                        {category.name}
                                    </TableCell>

                                    <TableCell>
                                        {category.discount > 0
                                            ? `${category.discount}%`
                                            : t("clients.noDiscount")}
                                    </TableCell>

                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        onEdit(category)
                                                    }
                                                >
                                                    <Pencil className="h-4 w-4 mr-2" />
                                                    {t("common.edit")}
                                                </DropdownMenuItem>

                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        onDelete(category)
                                                    }
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    {t("common.delete")}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Мобільні картки — видимі тільки на мобільному */}
            <div className="sm:hidden">
                {categories.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6">
                        {t("clients.noCategories")}
                    </p>
                ) : (
                    <div className="divide-y divide-border">
                        {categories.map((category) => (
                            <div
                                key={category.id}
                                className="flex items-center justify-between px-4 py-3"
                            >
                                <div className="min-w-0">
                                    <p className="font-medium text-sm truncate">
                                        {category.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {category.discount > 0
                                            ? `${category.discount}%`
                                            : t("clients.noDiscount")}
                                    </p>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="shrink-0 ml-2"
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            onClick={() => onEdit(category)}
                                        >
                                            <Pencil className="h-4 w-4 mr-2" />
                                            {t("common.edit")}
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            onClick={() => onDelete(category)}
                                            className="text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            {t("common.delete")}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}
