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
import { ArrowUpDown } from "lucide-react"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/src/components/ui/select"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Transaction } from "../types"

interface Props {
    transactions: Transaction[]
    ordering?: string
    changeOrdering: (value?: string) => void
    onEdit: (transaction: Transaction) => void
    onDelete: (transaction: Transaction) => void
}

export function PnLTable({
                             transactions,
                             ordering,
                             changeOrdering,
                             onEdit,
                             onDelete
                         }: Props) {

    const getVariant = (type: string | null) =>
        type === "income" ? "default" : "secondary"

    return (
        <div className="space-y-4 relative">

            {/* FILTER ROW - Positioned absolutely to align with parent header on ALL screens */}
            <div className="absolute -top-12 right-0 flex items-center justify-end z-20">
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                        <ArrowUpDown className="h-3.5 w-3.5 sm:h-4 sm:w-4"/>
                    </div>

                    <Select
                        value={ordering}
                        onValueChange={changeOrdering}
                    >
                        <SelectTrigger className="w-[130px] sm:w-[200px] h-8 sm:h-10 text-xs sm:text-sm">
                            <SelectValue placeholder="Sort by"/>
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="-created_at">Newest first</SelectItem>
                            <SelectItem value="created_at">Oldest first</SelectItem>
                            <SelectItem value="-amount">Amount high → low</SelectItem>
                            <SelectItem value="amount">Amount low → high</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>


            {/* DESKTOP TABLE */}
            <div className="hidden sm:block border border-border rounded-lg bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Comment</TableHead>
                            <TableHead className="w-[70px]"/>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {transactions.map(op => (
                            <TableRow key={op.id}>
                                <TableCell>
                                    <Badge variant={getVariant(op.type)}>
                                        {op.type}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-medium">
                                    {op.category}
                                </TableCell>
                                <TableCell>
                                    ${op.amount}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {op.created_at ? new Date(op.created_at).toLocaleDateString() : ""}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {op.comment}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <MoreHorizontal className="h-4 w-4"/>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onEdit(op)}>
                                                <Pencil className="h-4 w-4 mr-2"/>
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => onDelete(op)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2"/>
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


            {/* MOBILE CARDS */}
            <div className="sm:hidden space-y-2 pt-2">
                {transactions.map(op => (
                    <div key={op.id} className="border border-border rounded-lg bg-card p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <Badge variant={getVariant(op.type)} className="shrink-0">
                                    {op.type}
                                </Badge>
                                <span className="font-semibold text-sm truncate">{op.category}</span>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                                        <MoreHorizontal className="h-4 w-4"/>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onEdit(op)}>
                                        <Pencil className="h-4 w-4 mr-2"/>Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => onDelete(op)}>
                                        <Trash2 className="h-4 w-4 mr-2"/>Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-bold">${op.amount}</span>
                            <span className="text-muted-foreground">
                                {op.created_at ? new Date(op.created_at).toLocaleDateString() : ""}
                            </span>
                        </div>
                        {op.comment && (
                            <p className="text-xs text-muted-foreground truncate">{op.comment}</p>
                        )}
                    </div>
                ))}
            </div>

        </div>

    )
}