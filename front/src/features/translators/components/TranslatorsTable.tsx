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
    UserCheck,
} from "lucide-react"
import type { Translator } from "../types"
import {DashboardHeader} from "@/src/shared/components/layout/DashboardHeader";

interface Props {
    translators: Translator[]
    onEdit: (t: Translator) => void
    onDelete: (t: Translator) => void
    onDeactivate: (t: Translator) => void
}

export function TranslatorsTable({
                                     translators,
                                     onEdit,
                                     onDelete,
                                     onDeactivate,
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
                                <p className="font-medium">{t.full_name}</p>
                            </TableCell>

                            <TableCell>
                                <p className="text-sm text-muted-foreground">
                                    {t.email}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {t.phone || "—"}
                                </p>
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
                                            onClick={() => onEdit(t)}
                                        >
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            onClick={() => onDeactivate(t)}
                                        >
                                            <UserX className="h-4 w-4 mr-2" />
                                            Deactivate
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
