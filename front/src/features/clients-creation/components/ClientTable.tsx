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
    onDelete: (id: number) => void
}

export function ClientTable({
                                clients,
                                onEdit,
                                onDelete
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
                                        {client.category_name}
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
                                            onClick={() => onDelete(client.id)}
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
        </div>
    )
}