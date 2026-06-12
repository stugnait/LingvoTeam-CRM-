"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table"
import { Button } from "@/src/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/src/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import type { TranslatorTraffic } from "../types"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

interface Props {
    traffic: TranslatorTraffic[]
    onEdit: (t: TranslatorTraffic) => void
    onDelete: (t: TranslatorTraffic) => void
}

export function TranslatorTrafficTable({ traffic, onEdit, onDelete }: Props) {
    const { t } = useI18n()

    return (
        <div className="border border-border rounded-lg bg-card overflow-x-auto">
            <Table className="min-w-[640px]">
                <TableHeader>
                    <TableRow>
                        <TableHead>{t("common.name")}</TableHead>
                        <TableHead>{t("common.languagePair")}</TableHead>
                        <TableHead>{t("orders.category")}</TableHead>
                        <TableHead>{t("common.rate")} ({t("common.pageUnit")} / {t("common.actionUnit")})</TableHead>
                        <TableHead className="w-[70px]" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {traffic.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                {t("translators.noRatesFound")}
                            </TableCell>
                        </TableRow>
                    ) : (
                        traffic.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.name || "—"}</TableCell>
                                <TableCell>{item.source_language} - {item.target_language}</TableCell>
                                <TableCell>{item.category_name || "—"}</TableCell>
                                <TableCell>
                                    {item.rate_per_page} / {item.rate_per_action} {item.currency_sign}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onEdit(item)}>
                                                <Pencil className="h-4 w-4 mr-2" />
                                                {t("common.edit")}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onDelete(item)} className="text-destructive">
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
    )
}
