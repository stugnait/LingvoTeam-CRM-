"use client"

import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"

import { MoreHorizontal, Plus } from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"

import { ConfirmModal } from "@/src/components/modals/ConfirmModal"
import { BaseFormModal } from "@/src/components/modals/BaseFormModal"

import { Input } from "@/src/components/ui/input"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select"

import { useCategories } from "../hooks/useCategories"

export function CategoriesCard() {

    const {

        categories,

        selectedCategory,

        isFormOpen,
        isDeleteOpen,

        form,
        setForm,

        openAddCategory,
        openEditCategory,
        openDeleteCategory,

        submitCategory,
        confirmDelete,
        closeModals,

    } = useCategories()


    return (

        <div className="border rounded-lg bg-card p-4 space-y-4">

            <div className="flex items-center justify-between">

                <h3 className="font-semibold">
                    Categories
                </h3>

                <Button
                    size="sm"
                    onClick={openAddCategory}
                >
                    <Plus className="h-4 w-4 mr-2"/>
                    Add
                </Button>

            </div>


            {categories.map(cat => (

                <div
                    key={cat.id}
                    className="flex items-center justify-between border rounded-md p-3"
                >

                    <div>

                        <p className="font-medium">
                            {cat.name}
                        </p>

                        <Badge
                            variant={
                                cat.type === "income"
                                    ? "default"
                                    : "secondary"
                            }
                        >
                            {cat.type}
                        </Badge>

                    </div>


                    <DropdownMenu>

                        <DropdownMenuTrigger asChild>

                            <Button
                                variant="ghost"
                                size="icon"
                            >
                                <MoreHorizontal className="h-4 w-4"/>
                            </Button>

                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">

                            <DropdownMenuItem
                                onClick={() => openEditCategory(cat)}
                            >
                                Edit
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => openDeleteCategory(cat)}
                            >
                                Delete
                            </DropdownMenuItem>

                        </DropdownMenuContent>

                    </DropdownMenu>

                </div>

            ))}



            {/* CREATE / EDIT MODAL */}

            <BaseFormModal
                open={isFormOpen}
                onOpenChange={(open) => !open && closeModals()}
                title={
                    selectedCategory
                        ? "Edit category"
                        : "Create category"
                }
                submitLabel={
                    selectedCategory
                        ? "Update"
                        : "Create"
                }
                onSubmit={submitCategory}
            >

                <div className="space-y-4">

                    <Input
                        placeholder="Category name"
                        value={form.name}
                        onChange={(e) =>
                            setForm(prev => ({
                                ...prev,
                                name: e.target.value,
                            }))
                        }
                    />

                    <Select
                        value={form.type}
                        onValueChange={(value) =>
                            setForm(prev => ({
                                ...prev,
                                type: value as "income" | "expense",
                            }))
                        }
                    >

                        <SelectTrigger>
                            <SelectValue placeholder="Type"/>
                        </SelectTrigger>

                        <SelectContent>

                            <SelectItem value="income">
                                Income
                            </SelectItem>

                            <SelectItem value="expense">
                                Expense
                            </SelectItem>

                        </SelectContent>

                    </Select>

                </div>

            </BaseFormModal>



            {/* DELETE MODAL */}

            <ConfirmModal
                open={isDeleteOpen}
                onOpenChange={(open) => !open && closeModals()}
                title="Delete category"
                description="Are you sure you want to delete this category?"
                confirmVariant="destructive"
                onConfirm={confirmDelete}
            />

        </div>
    )
}