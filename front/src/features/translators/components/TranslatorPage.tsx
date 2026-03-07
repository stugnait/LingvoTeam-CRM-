"use client"

import { useTranslators } from "../hooks/useTranslators"
import { BaseFormModal } from "@/src/components/modals/BaseFormModal"
import { ConfirmModal } from "@/src/components/modals/ConfirmModal"

import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"
import { TranslatorsTable } from "./TranslatorsTable"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/src/components/ui/select";
import {DashboardHeader} from "@/src/shared/components/layout/DashboardHeader";

export default function TranslatorsPage() {
    const {
        translators,
        loading,

        form,
        setForm,

        isFormOpen,
        isConfirmOpen,
        confirmAction,
        selectedTranslator,

        openAddTranslator,
        openEditTranslator,
        openDeleteTranslator,
        openDeactivateTranslator,

        submitTranslator,
        confirmActionHandler,
        closeModals,
    } = useTranslators()

    return (
        <>
            <DashboardHeader />
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-semibold">Translators</h1>

                    <Button onClick={openAddTranslator}>
                        Add translator
                    </Button>
                </div>

                {/* Table */}
                <TranslatorsTable
                    translators={translators}
                    onEdit={openEditTranslator}
                    onDelete={openDeleteTranslator}
                    onDeactivate={openDeactivateTranslator}
                />

                {/* FORM MODAL */}
                <BaseFormModal
                    open={isFormOpen}
                    onOpenChange={(open) => !open && closeModals()}
                    title={selectedTranslator ? "Edit translator" : "Create translator"}
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
                            placeholder="Phone"
                            value={form.work_type}
                            onChange={(e) =>
                                setForm(prev => ({
                                    ...prev,
                                    work_type: Number(e.target.value),
                                }))
                            }
                        />

                        <Input
                            placeholder="Currency"
                            type="number"
                            value={form.currency_id}
                            onChange={(e) =>
                                setForm(prev => ({
                                    ...prev,
                                    phone: e.target.value,
                                }))
                            }
                        />

                    </div>
                </BaseFormModal>

                {/* CONFIRM MODAL */}
                <ConfirmModal
                    open={isConfirmOpen}
                    onOpenChange={(open) => !open && closeModals()}
                    title={
                        confirmAction === "delete"
                            ? "Delete translator"
                            : "Deactivate translator"
                    }
                    description={
                        selectedTranslator
                            ? `Are you sure you want to ${confirmAction} "${selectedTranslator.full_name}"?`
                            : ""
                    }
                    confirmLabel="Confirm"
                    onConfirm={confirmActionHandler}
                />
            </div>
        </>
    )
}
