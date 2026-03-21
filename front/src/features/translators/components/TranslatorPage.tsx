"use client"

import { useTranslators } from "../hooks/useTranslators"

import { useOrders } from "@/src/features/orders/hooks/useOrders"

import { BaseFormModal } from "@/src/components/modals/BaseFormModal"
import { ConfirmModal } from "@/src/components/modals/ConfirmModal"

import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/src/components/ui/card"

import { TranslatorsTable } from "./TranslatorsTable"

import { Plus } from "lucide-react"

import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"
import {TranslatorsFilters} from "@/src/features/translators/components/TranslatorFilter";

export default function TranslatorsPage() {
    const {
        translators,
        loading,

        form,
        setForm,

        search,
        setSearch,

        isFormOpen,
        isConfirmOpen,
        selectedTranslator,

        openAddTranslator,
        openEditTranslator,
        openDeleteTranslator,

        submitTranslator,
        confirmActionHandler,
        closeModals,
        ordering,
        setOrdering,
        sourceLanguage,
        setSourceLanguage,
        targetLanguage,
        setTargetLanguage,
    } = useTranslators()

    const {
        languages
    } = useOrders()



    return (
        <>
            <DashboardHeader />

            <main className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-6xl space-y-6">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">
                                Translators
                            </h2>

                            <p className="text-muted-foreground">
                                Manage translators and their contact details
                            </p>
                        </div>

                        <Button onClick={openAddTranslator}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Translator
                        </Button>
                    </div>

                    {/* Filters */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Filters</CardTitle>
                            <CardDescription>
                                Search translators by name or email
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <TranslatorsFilters
                                search={search}
                                setSearch={setSearch}

                                ordering={ordering}
                                setOrdering={setOrdering}

                                sourceLanguage={sourceLanguage}
                                setSourceLanguage={setSourceLanguage}

                                targetLanguage={targetLanguage}
                                setTargetLanguage={setTargetLanguage}

                                languages={languages} // масив з API
                            />
                        </CardContent>
                    </Card>

                    {/* Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Translators List</CardTitle>
                            <CardDescription>
                                All translators registered in the system
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-0">
                            <TranslatorsTable
                                translators={translators}
                                onEdit={openEditTranslator}
                                onDelete={openDeleteTranslator}
                            />
                        </CardContent>
                    </Card>
                </div>
            </main>

            {/* FORM MODAL */}
            <BaseFormModal
                open={isFormOpen}
                onOpenChange={(open) => !open && closeModals()}
                title={
                    selectedTranslator
                        ? "Edit Translator"
                        : "Create Translator"
                }
                submitLabel="Save"
                onSubmit={() => submitTranslator(form)}
            >
                <div className="space-y-4">
                    <Input
                        placeholder="Full name"
                        value={form.full_name}
                        onChange={(e) =>
                            setForm(prev => ({
                                ...prev,
                                full_name: e.target.value,
                            }))
                        }
                    />

                    <Input
                        placeholder="Email"
                        value={form.email}
                        onChange={(e) =>
                            setForm(prev => ({
                                ...prev,
                                email: e.target.value,
                            }))
                        }
                    />

                    <Input
                        placeholder="Phone"
                        value={form.phone}
                        onChange={(e) =>
                            setForm(prev => ({
                                ...prev,
                                phone: e.target.value,
                            }))
                        }
                    />

                    <Input
                        placeholder="Work type"
                        value={form.work_type}
                        onChange={(e) =>
                            setForm(prev => ({
                                ...prev,
                                work_type: Number(e.target.value),
                            }))
                        }
                    />

                    <Input
                        placeholder="Currency ID"
                        type="number"
                        value={form.currency_id}
                        onChange={(e) =>
                            setForm(prev => ({
                                ...prev,
                                currency_id: Number(e.target.value),
                            }))
                        }
                    />
                </div>
            </BaseFormModal>

            {/* DELETE CONFIRM */}
            <ConfirmModal
                open={isConfirmOpen}
                onOpenChange={(open) => !open && closeModals()}
                title="Delete translator"
                description={
                    selectedTranslator
                        ? `Are you sure you want to delete "${selectedTranslator.full_name}"?`
                        : ""
                }
                confirmLabel="Delete"
                onConfirm={confirmActionHandler}
            />
        </>
    )
}