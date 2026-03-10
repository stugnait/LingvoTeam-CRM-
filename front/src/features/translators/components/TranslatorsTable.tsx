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

interface Props {
    translators: Translator[]
    onEdit: (t: Translator) => void
    onDelete: (t: Translator) => void
}

export function TranslatorsTable({
                                     translators,
                                     onEdit,
                                     onDelete,
                                 }: Props) {
    return (
        <div className="border border-border rounded-lg bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Translator</TableHead>
                        <TableHead>Contacts</TableHead>
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
                </TableBody>
            </Table>
        </div>
    )
}