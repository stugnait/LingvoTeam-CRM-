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
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import type { ClientCategory } from "../types"

interface ClientCategoryTableProps {
    categories: ClientCategory[]
    onEdit: (category: ClientCategory) => void
    onDelete: (category: ClientCategory) => void
}

export function ClientCategoryTable({
                                        categories,
                                        onEdit,
                                        onDelete,
                                    }: ClientCategoryTableProps) {
    return (
        <>
            <div className="hidden sm:block border border-border rounded-lg bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Discount</TableHead>
                            <TableHead className="w-[70px]" />
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {categories.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={3}
                                    className="text-center text-muted-foreground py-6"
                                >
                                    No categories found
                                </TableCell>
                            </TableRow>
                        ) : (
                            categories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell className="font-medium">
                                        {category.name}
                                    </TableCell>

                                    <TableCell>
                                        {category.discount > 0
                                            ? `${category.discount}%`
                                            : "No discount"}
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
                                                    onClick={() =>
                                                        onEdit(category)
                                                    }
                                                >
                                                    <Pencil className="h-4 w-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>

                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        onDelete(category)
                                                    }
                                                    className="text-destructive"
                                                >
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

            {/* Мобільні картки — видимі тільки на мобільному */}
            <div className="sm:hidden">
                {categories.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6">
                        No categories found
                    </p>
                ) : (
                    <div className="divide-y divide-border">
                        {categories.map((category) => (
                            <div
                                key={category.id}
                                className="flex items-center justify-between px-4 py-3"
                            >
                                <div className="min-w-0">
                                    <p className="font-medium text-sm truncate">
                                        {category.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {category.discount > 0
                                            ? `${category.discount}%`
                                            : "No discount"}
                                    </p>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="shrink-0 ml-2"
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            onClick={() => onEdit(category)}
                                        >
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            onClick={() => onDelete(category)}
                                            className="text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
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