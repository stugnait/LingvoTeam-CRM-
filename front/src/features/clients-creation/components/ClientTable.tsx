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

interface ClientTableProps {
    clients: Client[]
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

    return (
        <div className="border border-border rounded-lg bg-card">
            <Table>

                <TableHeader>
                    <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Category</TableHead>
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
                                {client.category && (
                                    <Badge variant="secondary">
                                        {/* @ts-ignore: if category_name is missing, try category object */}
                                        {client.category_name || (client.category as any).name}
                                    </Badge>
                                )}
                            </TableCell>

                            <TableCell>
                                {client.email || "—"}
                            </TableCell>

                            <TableCell>
                                {client.phone_number || "—"}
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
                                            onClick={() => onEdit(client)}
                                        >
                                            <Pencil className="h-4 w-4 mr-2"/>
                                            Edit
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            onClick={() => onDelete(client)}
                                            className="text-destructive"
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

            <div className="flex items-center justify-center gap-2 py-4 border-t bg-muted/20">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => onPageChange(page - 1)}
                >
                    Previous
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
                    Next
                </Button>
            </div>
        </div>
    )
}