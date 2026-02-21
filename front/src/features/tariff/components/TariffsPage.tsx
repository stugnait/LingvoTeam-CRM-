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
import { ConfirmModal } from "@/src/components/modals/ConfirmModal"
import { Input } from "@/src/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select"

import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"

export function TariffsPage() {
    const {
        tariffs,
        isFormOpen,
        selectedTariff,
        form,
        setForm,
        openAddTariff,
        openEditTariff,
        closeModals,
        submitTariff,
    } = useTariffs()

    return (
        <>
            <DashboardHeader />

            <main className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-6xl space-y-6">

                    {/* Header */}
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

                    {/* Table */}
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
                            />
                        </CardContent>
                    </Card>
                </div>
            </main>

            {/* Add / Edit Modal */}
            <BaseFormModal
                open={isFormOpen}
                onOpenChange={(open) => !open && closeModals()}
                title={selectedTariff ? "Edit Tariff" : "Add Tariff"}
                submitLabel={selectedTariff ? "Update" : "Create"}
                onSubmit={() => submitTariff(form)}
            >
                <div className="space-y-4">
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

                    <Input
                        type="number"
                        placeholder="Price"
                        value={form.price}
                        onChange={(e) =>
                            setForm(prev => ({
                                ...prev,
                                price: Number(e.target.value),
                            }))
                        }
                    />

                    <Select
                        value={String(form.is_active)}
                        onValueChange={(value) =>
                            setForm(prev => ({
                                ...prev,
                                is_active: value === "true",
                            }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="true">Active</SelectItem>
                            <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </BaseFormModal>
        </>
    )
}