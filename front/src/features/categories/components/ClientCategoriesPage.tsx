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
import { useI18n } from "@/src/shared/i18n/I18nProvider"

export default function ClientCategoriesPage() {
    const { t } = useI18n()

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

            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="w-full min-w-0 space-y-4 sm:space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                                {t("clients.categoriesTitle")}
                            </h2>
                            <p className="text-muted-foreground">
                                {t("clients.categoriesDescription")}
                            </p>
                        </div>

                        <Button onClick={openAddCategory} className="shrink-0">
                            <Plus className="h-4 w-4 mr-2" />
                            {t("clients.addCategory")}
                        </Button>
                    </div>

                    {/* Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("clients.categories")}</CardTitle>
                            <CardDescription>
                                {t("clients.categoriesListDescription")}
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
                        ? t("clients.editCategory")
                        : t("clients.addCategory")
                }
                submitLabel={
                    selectedCategory ? t("common.save") : t("common.create")
                }
                onSubmit={submitCategory}
            >
                <div className="space-y-4">
                    <Input
                        placeholder={t("clients.categoryName")}
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
                        min="0"
                        placeholder={t("clients.discountPercent")}
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        onKeyDown={(e) => {
                            if (["-", "e", "E", "+"].includes(e.key)) {
                                e.preventDefault();
                            }
                        }}
                        // При фокусі виділяємо текст, щоб нове число затирало "0"
                        onFocus={(e) => e.target.select()}
                        value={form.discount === 0 ? "" : form.discount}
                        onChange={(e) => {
                            const val = e.target.value;
                            // Якщо поле порожнє, залишаємо 0, інакше парсимо в число
                            const numericValue = val === "" ? 0 : Math.max(0, parseInt(val, 10));

                            setForm((prev) => ({
                                ...prev,
                                discount: numericValue,
                            }))
                        }}
                    />
                </div>
            </BaseFormModal>

            {/* Delete Modal */}
            <ConfirmModal
                open={isDeleteOpen}
                onOpenChange={(open) => !open && closeModals()}
                title={t("clients.deleteCategory")}
                description={t("clients.deleteCategoryDescription", { name: selectedCategory?.name ?? "" })}
                confirmLabel={t("common.delete")}
                onConfirm={confirmDelete}
            />
        </>
    )
}
