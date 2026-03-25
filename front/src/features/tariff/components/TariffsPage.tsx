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
import {ConfirmModal} from "@/src/components/modals/ConfirmModal";

export function TariffsPage() {
    const {
        tariffs,
        categories,
        currencies,
        languages,
        isFormOpen,
        selectedTariff,
        form,
        setForm,
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
    } = useTariffs()

    return (
        <>
            <DashboardHeader />

            <main className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-6xl space-y-6">

                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">
                                Tariffs
                            </h2>
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
                            <CardDescription>
                                All available system tariffs
                            </CardDescription>
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
                        onChange={(e) =>
                            setForm(prev => ({
                                ...prev,
                                name: e.target.value,
                            }))
                        }
                    />

                    {/* Language Pair (поки що просто по id, якщо нема pairs endpoint) */}
                    <Select
                        value={String(form.language_pair || "")}
                        onValueChange={(value) =>
                            setForm(prev => ({
                                ...prev,
                                language_pair: Number(value),
                            }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent>
                            {languages.map(lang => (
                                <SelectItem
                                    key={lang.id}
                                    value={String(lang.id)}
                                >
                                    {lang.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Currency */}
                    <Select
                        value={String(form.currency_id || "")}
                        onValueChange={(value) =>
                            setForm(prev => ({
                                ...prev,
                                currency_id: Number(value),
                            }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent>
                            {currencies.map(currency => (
                                <SelectItem
                                    key={currency.id}
                                    value={String(currency.id)}
                                >
                                    {currency.code}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>


                    {/* Category */}
                    <Select
                        value={String(form.category || "")}
                        onValueChange={(value) =>
                            setForm(prev => ({
                                ...prev,
                                category: Number(value),
                            }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map(category => (
                                <SelectItem
                                    key={category.id}
                                    value={String(category.id)}
                                >
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Price per page */}
                    <Input
                        type="text"
                        min="1"
                        placeholder="Price per page"
                        value={form.price_per_page}
                        onChange={(e) => {
                            const value = e.target.value

                            // Дозволяємо тільки пусто або > 0
                            if (value === "" || Number(value) > 0) {
                                setForm(prev => ({
                                    ...prev,
                                    price_per_page: value,
                                }))
                            }
                        }}
                    />

                    {/* Price per action */}
                    <Input
                        type="text"
                        min="1"
                        placeholder="Price per action"
                        value={form.price_per_action}
                        onChange={(e) => {
                            const value = e.target.value

                            // Дозволяємо тільки пусто або > 0
                            if (value === "" || Number(value) > 0) {
                                setForm(prev => ({
                                    ...prev,
                                    price_per_action: value,
                                }))
                            }
                        }}
                    />

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