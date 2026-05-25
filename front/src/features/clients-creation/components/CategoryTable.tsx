"use client"

import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/src/components/ui/table"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"
import type { ClientCategory } from "../types"

interface CategoryTableProps {
    categories: ClientCategory[]
    onEdit: (category: ClientCategory) => void
    onDelete: (category: ClientCategory) => void
}

export function CategoryTable({ categories, onEdit, onDelete }: CategoryTableProps) {
    return (
        <>
            {/* Desktop таблиця */}
            <div className="hidden sm:block border border-border rounded-lg bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">ID</TableHead>
                            <TableHead className="w-full">Category Name</TableHead>
                            <TableHead>Discount</TableHead>
                            <TableHead className="w-[70px]" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.map((category) => (
                            <TableRow key={category.id}>
                                <TableCell className="font-medium">{category.id}</TableCell>
                                <TableCell>{category.name}</TableCell>
                                <TableCell>
                                    {category.discount_percent > 0 ? (
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                            {category.discount_percent}%
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-muted-foreground border-gray-200 bg-gray-50">
                                            0%
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <MoreHorizontal className="h-4 w-4"/>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onEdit(category)}>
                                                <Pencil className="h-4 w-4 mr-2"/> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => onDelete(category)}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2"/> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {categories.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                    No categories found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Мобільні картки */}
            <div className="sm:hidden">
                {categories.length === 0 ? (
                    <p className="text-center py-6 text-muted-foreground text-sm">No categories found.</p>
                ) : (
                    <div className="divide-y divide-border">
                        {categories.map((category) => (
                            <div key={category.id} className="flex items-center justify-between px-4 py-3">
                                <div className="min-w-0">
                                    <p className="font-medium text-sm truncate">{category.name}</p>
                                    <div className="mt-1">
                                        {category.discount_percent > 0 ? (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                                {category.discount_percent}%
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-muted-foreground border-gray-200 bg-gray-50 text-xs">
                                                0%
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="shrink-0 ml-2">
                                            <MoreHorizontal className="h-4 w-4"/>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onEdit(category)}>
                                            <Pencil className="h-4 w-4 mr-2"/> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onDelete(category)} className="text-destructive">
                                            <Trash2 className="h-4 w-4 mr-2"/> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}