"use client"

import { useState } from "react"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Plus, Users, Tags } from "lucide-react"
import { PatternFormat } from 'react-number-format'
import { cn } from "@/src/lib/utils"

import { ClientTable } from "./ClientTable"
import { CategoryTable } from "./CategoryTable"

import { BaseFormModal } from "@/src/components/modals/BaseFormModal"
import { ConfirmModal } from "@/src/components/modals/ConfirmModal"
import { Input } from "@/src/components/ui/input"
import { Combobox } from "@/src/components/ui/Combobox"
import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"

import { useClientsCreation } from "@/src/features/clients-creation/hooks/useClientsCreation"
import { useClientsCategories } from "@/src/features/clients-creation/hooks/useClientsCategories"
import { ClientFilters } from "@/src/features/clients-creation/components/ClientFilter"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

export function ClientPage() {
    const { t } = useI18n()

    // === СТАН ДЛЯ ПЕРЕМИКАННЯ РЕЖИМІВ ===
    const [viewMode, setViewMode] = useState<"clients" | "categories">("clients")

    // === КЛІЄНТИ ===
    const {
        clients, page, totalPages, onPageChange, search, setSearch,
        isFormOpen, isDeleteOpen, selectedClient, form, setForm, errors,
        openAddClient, openEditClient, openDeleteClient, submitClient,
        handleConfirm, closeModals,
    } = useClientsCreation()

    // === КАТЕГОРІЇ (використовуємо аліаси, щоб не було конфлікту імен) ===
    const {
        categories,
        isFormOpen: isCatFormOpen,
        isDeleteOpen: isCatDeleteOpen,
        selectedCategory,
        form: catForm,
        setForm: setCatForm,
        errors: catErrors,
        openAddCategory,
        openEditCategory,
        openDeleteCategory,
        submitCategory,
        handleConfirm: handleCatConfirm,
        closeModals: closeCatModals,
    } = useClientsCategories()

    // Формуємо опції категорій для селекта при створенні клієнта
    const categoryOptions = categories?.map(cat => ({
        value: String(cat.id),
        label: cat.name,
    }))

    return (
        <>
            <DashboardHeader />

            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="w-full min-w-0 space-y-4 sm:space-y-6">

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                                {viewMode === "clients" ? t("clients.title") : t("clients.categoriesTitle")}
                            </h2>
                            <p className="text-muted-foreground">
                                {t("clients.manage", { entity: viewMode === "clients" ? t("clients.entityClients") : t("clients.entityCategories") })}
                            </p>
                        </div>

                        {/* Перемикач та Кнопка додавання */}
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            {/* СВІТЧ */}
                            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex-1 sm:flex-none">
                                <button
                                    onClick={() => setViewMode("clients")}
                                    className={cn(
                                        "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all flex-1 sm:flex-none justify-center",
                                        viewMode === "clients"
                                            ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600"
                                            : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    <Users className="w-4 h-4"/>
                                    {t("clients.title")}
                                </button>
                                <button
                                    onClick={() => setViewMode("categories")}
                                    className={cn(
                                        "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all flex-1 sm:flex-none justify-center",
                                        viewMode === "categories"
                                            ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600"
                                            : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    <Tags className="w-4 h-4"/>
                                    {t("clients.categories")}
                                </button>
                            </div>

                            {/* Динамічна кнопка */}
                            <Button onClick={viewMode === "clients" ? openAddClient : openAddCategory} className="shrink-0">
                                <Plus className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">
                                    {viewMode === "clients" ? t("clients.addClient") : t("clients.addCategory")}
                                </span>
                            </Button>
                        </div>
                    </div>

                    {/* Фільтри показуємо тільки для клієнтів */}
                    {viewMode === "clients" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("common.search")}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ClientFilters search={search} setSearch={setSearch} />
                            </CardContent>
                        </Card>
                    )}

                    {/* Table Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {viewMode === "clients" ? t("clients.clientsList") : t("clients.categoriesList")}
                            </CardTitle>
                            <CardDescription>
                                {t("clients.allRegistered", { entity: viewMode === "clients" ? t("clients.entityClients") : t("clients.entityCategories") })}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-0">
                            {/* Динамічний рендер таблиць */}
                            {viewMode === "clients" ? (
                                <ClientTable
                                    clients={clients}
                                    onEdit={openEditClient}
                                    onDelete={(client) => client && openDeleteClient(client)}
                                    page={page}
                                    totalPages={totalPages}
                                    onPageChange={onPageChange}
                                />
                            ) : (
                                <CategoryTable
                                    categories={categories}
                                    onEdit={openEditCategory}
                                    onDelete={(cat) => cat && openDeleteCategory(cat)}
                                />
                            )}
                        </CardContent>
                    </Card>

                </div>
            </main>

            {/* =============================
                МОДАЛКИ ДЛЯ КЛІЄНТІВ
            ============================= */}
            <BaseFormModal
                open={isFormOpen}
                onOpenChange={(open) => !open && closeModals()}
                title={selectedClient ? t("clients.editClient") : t("clients.addClient")}
                submitLabel={selectedClient ? t("common.save") : t("common.create")}
                onSubmit={() => submitClient(form)}
            >
                <div className="space-y-4">
                    <div>
                        <Input
                            placeholder={t("clients.clientName")}
                            value={form.full_name}
                            className={errors?.full_name ? "border-red-500" : ""}
                            onChange={(e) => setForm(prev => ({ ...prev, full_name: e.target.value }))}
                        />
                        {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>}
                    </div>

                    <div>
                        <Input
                            placeholder={t("auth.email")}
                            value={form.email}
                            className={errors?.email ? "border-red-500" : ""}
                            onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>

                    <div>
                        <PatternFormat
                            format="+38 (###) ###-##-##"
                            allowEmptyFormatting
                            mask="_"
                            value={form.phone_number}
                            customInput={Input}
                            type="tel"
                            className={errors?.phone_number ? "border-red-500" : ""}
                            onValueChange={(values) => {
                                setForm(prev => ({ ...prev, phone_number: values.formattedValue }))
                            }}
                        />
                        {errors.phone_number && <p className="text-red-500 text-sm mt-1">{errors.phone_number}</p>}
                    </div>

                    <div>
                        <Combobox
                            options={categoryOptions}
                            value={String(form.category || "")}
                            onChange={(value) => setForm(prev => ({ ...prev, category: Number(value) }))}
                            placeholder={t("clients.selectCategory")}
                        />
                    </div>
                </div>
            </BaseFormModal>

            <ConfirmModal
                open={isDeleteOpen}
                onOpenChange={(open) => !open && closeModals()}
                title={t("clients.deleteClient")}
                description={t("clients.deleteClientDescription", { name: selectedClient?.full_name ?? "" })}
                confirmLabel={t("common.delete")}
                onConfirm={handleConfirm}
            />

            {/* =============================
                МОДАЛКИ ДЛЯ КАТЕГОРІЙ
            ============================= */}
            <BaseFormModal
                open={isCatFormOpen}
                onOpenChange={(open) => !open && closeCatModals()}
                title={selectedCategory ? t("clients.editCategory") : t("clients.addCategory")}
                submitLabel={selectedCategory ? t("common.save") : t("common.create")}
                onSubmit={() => submitCategory(catForm)}
            >
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">{t("clients.categoryName")}</label>
                        <Input
                            placeholder={t("clients.categoryNamePlaceholder")}
                            value={catForm.name}
                            className={catErrors?.name ? "border-red-500" : ""}
                            onChange={(e) => setCatForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                        {catErrors.name && <p className="text-red-500 text-sm mt-1">{catErrors.name}</p>}
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">{t("clients.discountPercent")}</label>
                        <Input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="0"
                            value={catForm.discount_percent === 0 && !selectedCategory ? "" : catForm.discount_percent}
                            className={catErrors?.discount_percent ? "border-red-500" : ""}
                            onChange={(e) => setCatForm(prev => ({ ...prev, discount_percent: Number(e.target.value) }))}
                        />
                        {catErrors.discount_percent && <p className="text-red-500 text-sm mt-1">{catErrors.discount_percent}</p>}
                    </div>
                </div>
            </BaseFormModal>

            <ConfirmModal
                open={isCatDeleteOpen}
                onOpenChange={(open) => !open && closeCatModals()}
                title={t("clients.deleteCategory")}
                description={t("clients.deleteCategoryDescription", { name: selectedCategory?.name ?? "" })}
                confirmLabel={t("common.delete")}
                onConfirm={handleCatConfirm}
            />
        </>
    )
}
