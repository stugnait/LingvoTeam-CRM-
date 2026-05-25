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

import { TariffTable } from "./TariffTable"
import { useTariffs } from "../hooks/useTariff"
import { TariffForm } from "./TariffForm"

import { BaseFormModal } from "@/src/components/modals/BaseFormModal"
import { Input } from "@/src/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select"

import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"
import { ConfirmModal } from "@/src/components/modals/ConfirmModal"

export function TariffsPage() {
    const {
        tariffs,
        categories,
        currencies,
        languages,
        languagePairs,
        isFormOpen,
        selectedTariff,
        form,
        setForm,
        errors,
        openAddTariff,
        openEditTariff,
        closeModals,
        submitTariff,
        isDeleteOpen,
        openDeleteTariff,
        confirmDelete,
        page,
        totalPages,
        onPageChange,
        isNewPairModalOpen,
        setIsNewPairModalOpen,
        newPairForm,
        setNewPairForm,
        newPairLoading,
        createAndSelectPair,
    } = useTariffs()

    return (
        <>
            <DashboardHeader />

            <main className="flex-1 overflow-y-auto p-3 sm:p-6">
                <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Tariffs</h2>
                            <p className="text-muted-foreground">
                                Manage pricing plans and configurations
                            </p>
                        </div>
                        <Button onClick={openAddTariff}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Tariff
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Tariffs List</CardTitle>
                            <CardDescription>All available system tariffs</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <TariffTable
                                tariffs={tariffs}
                                onEdit={openEditTariff}
                                onDelete={openDeleteTariff}
                                page={page}
                                totalPages={totalPages}
                                onPageChange={onPageChange}
                            />
                        </CardContent>
                    </Card>
                </div>
            </main>

            <BaseFormModal
                open={isFormOpen}
                onOpenChange={(open) => !open && closeModals()}
                title={selectedTariff ? "Edit Tariff" : "Add Tariff"}
                submitLabel={selectedTariff ? "Update" : "Create"}
                onSubmit={() => submitTariff(form)}
            >
                <div className="space-y-4">

                    {/* Name */}
                    <Input
                        placeholder="Tariff name"
                        value={form.name}
                        className={errors?.name ? "border-red-500" : ""}
                        onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                    {errors?.name && (
                        <p className="text-xs text-red-500 -mt-2">{errors.name}</p>
                    )}

                    {/* Language Pair + кнопка нової пари */}
                    <TariffForm
                        form={form}
                        setForm={setForm}
                        errors={errors}
                        languages={languages}
                        languagePairs={languagePairs}
                        isNewPairModalOpen={isNewPairModalOpen}
                        setIsNewPairModalOpen={setIsNewPairModalOpen}
                        newPairForm={newPairForm}
                        setNewPairForm={setNewPairForm}
                        newPairLoading={newPairLoading}
                        createAndSelectPair={createAndSelectPair}
                    />

                    {/* Currency */}
                    <Select
                        value={String(form.currency_id || "")}
                        onValueChange={(val) => setForm(prev => ({ ...prev, currency_id: Number(val) }))}
                    >
                        <SelectTrigger className={errors?.currency_id ? "border-red-500" : ""}>
                            <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent>
                            {currencies.map(currency => (
                                <SelectItem key={currency.id} value={String(currency.id)}>
                                    {currency.code}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors?.currency_id && (
                        <p className="text-xs text-red-500 -mt-2">{errors.currency_id}</p>
                    )}

                    {/* Category */}
                    <Select
                        value={String(form.category || "")}
                        onValueChange={(val) => setForm(prev => ({ ...prev, category: Number(val) }))}
                    >
                        <SelectTrigger className={errors?.category ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map(category => (
                                <SelectItem key={category.id} value={String(category.id)}>
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors?.category && (
                        <p className="text-xs text-red-500 -mt-2">{errors.category}</p>
                    )}

                    {/* Price per page */}
                    {/* Price per page */}
                    <Input

                        type="number"
                        min="0"
                        step="any"
                        placeholder="Price per page"
                        className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors?.price_per_page ? "border-red-500" : ""}`}
                        onKeyDown={(e) => {
                            if (["-", "e", "E", "+"].includes(e.key)) {
                                e.preventDefault();

                            }
                        }}
                        onFocus={(e) => e.target.select()}
                        // Переводимо у рядок для безпечного порівняння з "0"
                        value={String(form.price_per_page) === "0" ? "" : form.price_per_page}
                        onChange={(e) => {
                            const val = e.target.value;
                            setForm(prev => ({
                                ...prev,
                                // Зберігаємо як рядок ("0" замість 0)
                                price_per_page: val === "" ? "0" : val,
                            }))
                        }}
                    />
                    {errors?.price_per_page && (
                        <p className="text-xs text-red-500 -mt-2">{errors.price_per_page}</p>
                    )}

                    {/* Price per action */}
                    <Input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Price per action"
                        className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors?.price_per_action ? "border-red-500" : ""}`}
                        onKeyDown={(e) => {
                            if (["-", "e", "E", "+"].includes(e.key)) {
                                e.preventDefault();
                            }
                        }}
                        onFocus={(e) => e.target.select()}
                        // Переводимо у рядок для безпечного порівняння з "0"
                        value={String(form.price_per_action) === "0" ? "" : form.price_per_action}
                        onChange={(e) => {
                            const val = e.target.value;
                            setForm(prev => ({
                                ...prev,
                                // Зберігаємо як рядок ("0" замість 0)
                                price_per_action: val === "" ? "0" : val,
                            }))
                        }}
                    />
                    {errors?.price_per_action && (
                        <p className="text-xs text-red-500 -mt-2">{errors.price_per_action}</p>
                    )}

                </div>
            </BaseFormModal>

            <ConfirmModal
                open={isDeleteOpen}
                onOpenChange={(open) => !open && closeModals()}
                onConfirm={confirmDelete}
                title="Delete Tariff"
                description="Are you sure you want to delete this tariff?"
            />
        </>
    )
}