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
import { MoreHorizontal, Trash2 } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"
import type { Language } from "../types"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

interface LanguageTableProps {
    languages: Language[]
    onDelete: (language: Language) => void
    loading: boolean
    page: number
    totalPages: number
    onPageChange: (page: number) => void
}

export function LanguageTable({
                                  languages,
                                  onDelete,
                                  loading,
                                  page,
                              totalPages,
                              onPageChange
                          }: LanguageTableProps) {
    const { t } = useI18n()

    return (
        <div className="border border-border rounded-lg bg-card">

            {/* Desktop таблиця */}
            <div className="hidden sm:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">ID</TableHead>
                            <TableHead>{t("languages.name")}</TableHead>
                            <TableHead>{t("languages.slug")}</TableHead>
                            <TableHead className="w-[70px]" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && languages.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                    {t("common.loading")}
                                </TableCell>
                            </TableRow>
                        ) : languages.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                    {t("languages.notFound")}
                                </TableCell>
                            </TableRow>
                        ) : (
                            languages.map((language) => (
                                <TableRow key={language.id}>
                                    <TableCell className="font-medium text-muted-foreground">
                                        {language.id}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {language.name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-muted/50 font-mono">
                                            {language.slug}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreHorizontal className="h-4 w-4"/>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => onDelete(language)}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2"/>
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

            {/* Мобільні картки */}
            <div className="sm:hidden divide-y divide-border">
                {loading && languages.length === 0 ? (
                    <p className="text-center py-6 text-muted-foreground text-sm">{t("common.loading")}</p>
                ) : languages.length === 0 ? (
                    <p className="text-center py-6 text-muted-foreground text-sm">{t("languages.notFound")}</p>
                ) : (
                    languages.map((language) => (
                        <div key={language.id} className="flex items-center justify-between px-4 py-3 gap-3">
                            <div className="min-w-0 space-y-1">
                                <p className="font-medium text-sm truncate">{language.name}</p>
                                <Badge variant="outline" className="bg-muted/50 text-xs font-mono">
                                    {language.slug}
                                </Badge>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="shrink-0">
                                        <MoreHorizontal className="h-4 w-4"/>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() => onDelete(language)}
                                        className="text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2"/>
                                        {t("common.delete")}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ))
                )}
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
