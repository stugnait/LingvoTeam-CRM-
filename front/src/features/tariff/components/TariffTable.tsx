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
import {MoreHorizontal, Pencil, DollarSign, FileText, Hash, Trash} from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"

import type { Tariff } from "../types"
import { cn } from "@/src/lib/utils"

interface TariffTableProps {
    tariffs: Tariff[]
    onEdit: (tariff: Tariff) => void
    onDelete: (tariff: Tariff) => void
    page: number
    totalPages: number
    onPageChange: (page: number) => void
}

export function TariffTable({
                                tariffs,
                                onEdit,
                                onDelete,
                                page,
                                totalPages,
                                onPageChange
                            }: TariffTableProps) {
    return (
        <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <Table className="min-w-[700px]">
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="font-semibold text-foreground/80">Name</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Language Pair</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Category</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Price / Page</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Price / Action</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Currency</TableHead>
                            <TableHead className="w-[70px] font-semibold text-foreground/80" />
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {tariffs.map((tariff, index) => (
                            <TableRow
                                key={tariff.id}
                                className={cn(
                                    "transition-colors hover:bg-muted/30",
                                    index % 2 === 0 ? "bg-background" : "bg-muted/10"
                                )}
                            >
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                                        {tariff.name}
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <div className="flex items-center gap-1.5">
                                    <span className="px-2 py-1 bg-primary/5 rounded-md text-sm font-medium">
                                        {tariff.source_language_name}
                                    </span>
                                        <span className="text-muted-foreground">→</span>
                                        <span className="px-2 py-1 bg-primary/5 rounded-md text-sm font-medium">
                                        {tariff.target_language_name}
                                    </span>
                                    </div>
                                </TableCell>

                                <TableCell>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                    <FileText className="w-3 h-3 mr-1" />
                                    {tariff.category_name}
                                </span>
                                </TableCell>

                                <TableCell>
                                    <div className="flex items-center gap-1">
                                    <span className="text-sm font-semibold text-foreground">
                                        {tariff.currency_sign}
                                        {tariff.price_per_page}
                                    </span>
                                        <span className="text-xs text-muted-foreground">/page</span>
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <div className="flex items-center gap-1">
                                    <span className="text-sm font-semibold text-foreground">
                                        {tariff.currency_sign}
                                        {tariff.price_per_action}
                                    </span>
                                        <span className="text-xs text-muted-foreground">/action</span>
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <div className="flex items-center gap-1.5">
                                        <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="text-sm">{tariff.currency_name}</span>
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent
                                            align="end"
                                            className="w-32"
                                        >
                                            <DropdownMenuItem
                                                onClick={() => onEdit(tariff)}
                                                className="cursor-pointer hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary"
                                            >
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => onDelete(tariff)}
                                                className="
        cursor-pointer
        text-destructive
        focus:text-destructive
        hover:text-destructive
        hover:bg-destructive/10
        focus:bg-destructive/10
        transition-colors
    "
                                            >
                                                <Trash className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}

                        {tariffs.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="text-center py-16 text-muted-foreground"
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <FileText className="w-12 h-12 text-muted-foreground/30" />
                                        <p className="text-lg font-medium">No tariffs found</p>
                                        <p className="text-sm text-muted-foreground/70">
                                            Get started by creating your first tariff
                                        </p>
                                    </div>
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