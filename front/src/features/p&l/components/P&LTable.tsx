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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import { Transaction } from "../types"

interface Props {
    transactions: Transaction[]
    onEdit: (transaction: Transaction) => void
    onDelete: (transaction: Transaction) => void
}

export function PnLTable({
                             transactions,
                             onEdit,
                             onDelete
                         }: Props) {

    const getVariant = (type: string | null) =>
        type === "income" ? "default" : "secondary"

    return (

        <div className="border border-border rounded-lg bg-card">

            <Table>

                <TableHeader>
                    <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Comment</TableHead>
                        <TableHead className="w-[70px]" />
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
                                {new Date(op.created_at).toLocaleDateString()}
                            </TableCell>

                            <TableCell className="text-muted-foreground">
                                {op.comment}
                            </TableCell>

                            <TableCell>

                                <DropdownMenu>

                                    <DropdownMenuTrigger asChild>

                                        <Button variant="ghost" size="sm">
                                            <MoreHorizontal className="h-4 w-4" />
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

    )
}