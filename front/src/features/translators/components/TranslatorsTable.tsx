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

import {
    MoreHorizontal,
    Pencil,
    Trash2,
} from "lucide-react"

import type { Translator } from "../types"
import {cn} from "@/src/lib/utils";
import { useI18n } from "@/src/shared/i18n/I18nProvider"

interface Props {
    translators: Translator[]
    onEdit: (t: Translator) => void
    onDelete: (t: Translator) => void
    page: number
    totalPages: number
    onPageChange: (page: number) => void
}

export function TranslatorsTable({
                                     translators,
                                     onEdit,
                                     onDelete,
                                     page,
                                     totalPages,
                                     onPageChange
                                 }: Props) {
    const { t } = useI18n()

    return (
        <div className="border border-border rounded-lg bg-card">
            <div className="overflow-x-auto">
                <Table className="min-w-[560px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("common.translator")}</TableHead>
                            <TableHead>{t("translators.contacts")}</TableHead>
                            <TableHead>{t("common.orders")}</TableHead>
                            <TableHead>{t("common.tariffs")}</TableHead>
                            <TableHead className="w-[70px]" />
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {translators.map((translator) => (
                            <TableRow key={translator.id}>
                                <TableCell>
                                    <p className="font-medium">
                                        {translator.full_name}
                                    </p>
                                </TableCell>

                                <TableCell>
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            {translator.email}
                                        </p>

                                        <p className="text-sm text-muted-foreground">
                                            {translator.phone || "—"}
                                        </p>
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <div className="flex items-center">
        <span
            className={cn(
                "px-2.5 py-1 rounded-md text-xs font-semibold",
                translator.orders_count === 0
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary/10 text-primary"
            )}
        >
            {translator.orders_count ?? 0}
        </span>
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                {t("translators.ratesCount", { count: translator.traffic?.length || 0 })}
                                            </Button>
                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent align="start" className="w-[280px]">
                                            {translator.traffic?.length ? (
                                                translator.traffic.map((tr) => (
                                                    <div
                                                        key={tr.id}
                                                        className="px-3 py-2 border-b last:border-0"
                                                    >
                                                        <p className="text-sm font-medium">
                                                            {tr.language_pair_name}
                                                        </p>

                                                        <p className="text-xs text-muted-foreground">
                                                            {tr.source_language} → {tr.target_language}
                                                        </p>

                                                        <div className="flex justify-between mt-1 text-xs">
                            <span>
                                {t("translators.pageRate", { value: tr.rate_per_page, currency: tr.currency_sign })}
                            </span>
                                                            <span>
                                {t("translators.actionRate", { value: tr.rate_per_action, currency: tr.currency_sign })}
                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="px-3 py-2 text-sm text-muted-foreground">
                                                    {t("translators.noRates")}
                                                </p>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
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
                                                onClick={() => onEdit(translator)}
                                            >
                                                <Pencil className="h-4 w-4 mr-2" />
                                                {t("common.edit")}
                                            </DropdownMenuItem>

                                            <DropdownMenuItem
                                                onClick={() => onDelete(translator)}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                {t("common.delete")}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}

                        {translators.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    {t("translators.noFound")}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-center gap-2 py-4 border-t bg-muted/20 flex-wrap px-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => onPageChange(page - 1)}
                >
                    {t("common.previous")}
                </Button>

                <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => {
                        const pageNumber = i + 1

                        return (
                            <Button
                                key={pageNumber}
                                size="sm"
                                variant={page === pageNumber ? "default" : "outline"}
                                onClick={() => onPageChange(pageNumber)}
                                className="w-9"
                            >
                                {pageNumber}
                            </Button>
                        )
                    })}
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
