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
    UserX,
} from "lucide-react"

import type { Translator } from "../types"
import {cn} from "@/src/lib/utils";

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
    return (
        <div className="border border-border rounded-lg bg-card">
            <div className="overflow-x-auto">
                <Table className="min-w-[560px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Translator</TableHead>
                            <TableHead>Contacts</TableHead>
                            <TableHead>Orders</TableHead>
                            <TableHead>Tariffs</TableHead>
                            <TableHead className="w-[70px]" />
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {translators.map((t) => (
                            <TableRow key={t.id}>
                                <TableCell>
                                    <p className="font-medium">
                                        {t.full_name}
                                    </p>
                                </TableCell>

                                <TableCell>
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            {t.email}
                                        </p>

                                        <p className="text-sm text-muted-foreground">
                                            {t.phone || "—"}
                                        </p>
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <div className="flex items-center">
        <span
            className={cn(
                "px-2.5 py-1 rounded-md text-xs font-semibold",
                t.orders_count === 0
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary/10 text-primary"
            )}
        >
            {t.orders_count ?? 0}
        </span>
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                {t.traffic?.length || 0} rates
                                            </Button>
                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent align="start" className="w-[280px]">
                                            {t.traffic?.length ? (
                                                t.traffic.map((tr) => (
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
                                Page: {tr.rate_per_page} {tr.currency_sign}
                            </span>
                                                            <span>
                                Action: {tr.rate_per_action} {tr.currency_sign}
                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="px-3 py-2 text-sm text-muted-foreground">
                                                    No rates
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
                                                onClick={() => onEdit(t)}
                                            >
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>

                                            <DropdownMenuItem
                                                onClick={() => onDelete(t)}
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

                        {translators.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No translators found.
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
                    Previous
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
                    Next
                </Button>
            </div>
        </div>
    )
}