"use client"

import { Button } from "@/src/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/src/components/ui/card"
import { Plus } from "lucide-react"

import { useClientCategories } from "../hooks/useCategories"
import { ClientCategoryTable } from "./ClientCategoryTable"

import { BaseFormModal } from "@/src/components/modals/BaseFormModal"
import { ConfirmModal } from "@/src/components/modals/ConfirmModal"
import { Input } from "@/src/components/ui/input"

import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"

export default function ClientCategoriesPage() {
    const {
        categories,

        isFormOpen,
        isDeleteOpen,
        selectedCategory,
        form,
        setForm,

        openAddCategory,
        openEditCategory,
        openDeleteCategory,

        submitCategory,
        confirmDelete,
        closeModals,
    } = useClientCategories()

    return (
        <>
            <DashboardHeader />

            <main className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-6xl space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">
                                Client Categories
                            </h2>
                            <p className="text-muted-foreground">
                                Manage client categories and discounts
                            </p>
                        </div>

                        <Button onClick={openAddCategory}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Category
                        </Button>
                    </div>

                    {/* Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Categories</CardTitle>
                            <CardDescription>
                                List of all client categories
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-0">
                            <ClientCategoryTable
                                categories={categories}
                                onEdit={openEditCategory}
                                onDelete={openDeleteCategory}
                            />
                        </CardContent>
                    </Card>
                </div>
            </main>

            {/* Create / Edit Modal */}
            <BaseFormModal
                open={isFormOpen}
                onOpenChange={(open) => !open && closeModals()}
                title={
                    selectedCategory
                        ? "Edit Category"
                        : "Add Category"
                }
                submitLabel={
                    selectedCategory ? "Update" : "Create"
                }
                onSubmit={submitCategory}
            >
                <div className="space-y-4">
                    <Input
                        placeholder="Category name"
                        value={form.name}
                        onChange={(e) =>
                            setForm((prev) => ({
                                ...prev,
                                name: e.target.value,
                            }))
                        }
                    />

                    <Input
                        type="number"
                        placeholder="Discount (%)"
                        value={form.discount}
                        onChange={(e) =>
                            setForm((prev) => ({
                                ...prev,
                                discount: Number(e.target.value),
                            }))
                        }
                    />
                </div>
            </BaseFormModal>

            {/* Delete Modal */}
            <ConfirmModal
                open={isDeleteOpen}
                onOpenChange={(open) => !open && closeModals()}
                title="Delete category"
                description={`Are you sure you want to delete ${selectedCategory?.name}? This action cannot be undone.`}
                confirmLabel="Delete"
                onConfirm={confirmDelete}
            />
        </>
    )
}