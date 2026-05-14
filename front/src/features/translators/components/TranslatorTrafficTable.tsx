"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table"
import { Button } from "@/src/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/src/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import type { TranslatorTraffic } from "../types"

interface Props {
    traffic: TranslatorTraffic[]
    onEdit: (t: TranslatorTraffic) => void
    onDelete: (t: TranslatorTraffic) => void
}

export function TranslatorTrafficTable({ traffic, onEdit, onDelete }: Props) {
    return (
        <div className="border border-border rounded-lg bg-card overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Translator</TableHead>
                        <TableHead>Language Pair</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Rate (Page / Action)</TableHead>
                        <TableHead className="w-[70px]" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {traffic.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                No rates found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        traffic.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.name || "—"}</TableCell>
                                <TableCell>{item.translator_name || "—"}</TableCell>
                                <TableCell>{item.source_language} - {item.target_language}</TableCell>
                                <TableCell>{item.category_name || "—"}</TableCell>
                                <TableCell>
                                    {/* @ts-ignore */}
                                    {item.rate_per_page} / {item.rate_per_action} {item.currency_sign}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onEdit(item)}>
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onDelete(item)} className="text-destructive">
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}