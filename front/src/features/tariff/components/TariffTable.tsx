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
import { MoreHorizontal, Pencil } from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"

import type { Tariff } from "../types"

interface TariffTableProps {
    tariffs: Tariff[]
    onEdit: (tariff: Tariff) => void
}

export function TariffTable({
                                tariffs,
                                onEdit,
                            }: TariffTableProps) {
    return (
        <div className="border border-border rounded-lg bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Language Pair</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price / Page</TableHead>
                        <TableHead>Price / Action</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead className="w-[70px]" />
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {tariffs.map((tariff) => (
                        <TableRow key={tariff.id}>
                            <TableCell className="font-medium">
                                {tariff.name}
                            </TableCell>

                            <TableCell>
                                {tariff.source_language} → {tariff.target_language}
                            </TableCell>

                            <TableCell>
                                {tariff.category_name}
                            </TableCell>

                            <TableCell>
                                {tariff.currency_sign}
                                {tariff.price_per_page}
                            </TableCell>

                            <TableCell>
                                {tariff.currency_sign}
                                {tariff.price_per_action}
                            </TableCell>

                            <TableCell>
                                {tariff.currency_name}
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
                                            onClick={() => onEdit(tariff)}
                                        >
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Edit
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
                                className="text-center py-10 text-muted-foreground"
                            >
                                No tariffs found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}