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
import { Input } from "@/src/components/ui/input"

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

        <div className="space-y-4">

            {/* FILTER */}

            <div className="flex items-center justify-end mb-4">

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ArrowUpDown className="h-4 w-4"/>
                </div>

                <Select
                    value={ordering}
                    onValueChange={changeOrdering}
                >
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Sort by"/>
                    </SelectTrigger>

                    <SelectContent>

                        <SelectItem value="-created_at">
                            Newest first
                        </SelectItem>

                        <SelectItem value="created_at">
                            Oldest first
                        </SelectItem>

                        <SelectItem value="-amount">
                            Amount high → low
                        </SelectItem>

                        <SelectItem value="amount">
                            Amount low → high
                        </SelectItem>

                    </SelectContent>

                </Select>

            </div>


            {/* TABLE */}

            <div className="border border-border rounded-lg bg-card">

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

                                            <DropdownMenuItem
                                                onClick={() => onEdit(op)}
                                            >
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

        </div>

    )
}