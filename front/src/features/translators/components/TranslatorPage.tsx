"use client"

import { useTranslators } from "../hooks/useTranslators"
import { useOrders } from "@/src/features/orders/hooks/useOrders"
import { BaseFormModal } from "@/src/components/modals/BaseFormModal"
import { ConfirmModal } from "@/src/components/modals/ConfirmModal"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"
import { PatternFormat } from 'react-number-format'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/src/components/ui/card"

// 👇 1. Додаємо імпорти для Select
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select"

import { TranslatorsTable } from "./TranslatorsTable"
import { Plus } from "lucide-react"
import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"
import { TranslatorsFilters } from "@/src/features/translators/components/TranslatorFilter";

export default function TranslatorsPage() {
    const {
        translators,
        loading,

        form,
        setForm,
        errors,

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

        page,
        totalPages,
        onPageChange,

        // 👇 Беремо валюти з хука
        currencies
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
                                languages={languages}
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
                                page={page}
                                totalPages={totalPages}
                                onPageChange={onPageChange}
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

                    <div>
                        <Input
                            placeholder="Full name"
                            value={form.full_name}
                            className={errors?.full_name ? "border-red-500" : ""}
                            onChange={(e) =>
                                setForm(prev => ({
                                    ...prev,
                                    full_name: e.target.value,
                                }))
                            }
                        />
                        {errors?.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
                    </div>

                    <div>
                        <Input
                            placeholder="Email"
                            value={form.email}
                            className={errors?.email ? "border-red-500" : ""}
                            onChange={(e) =>
                                setForm(prev => ({
                                    ...prev,
                                    email: e.target.value,
                                }))
                            }
                        />
                        {errors?.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                    </div>

                    <div>
                        <PatternFormat
                            format="+38 (###) ###-##-##"
                            allowEmptyFormatting
                            mask="_"
                            value={form.phone}
                            customInput={Input}
                            type="tel"
                            className={errors?.phone ? "border-red-500" : ""}
                            onValueChange={(values) => {
                                setForm(prev => ({
                                    ...prev,
                                    phone: values.formattedValue,
                                }))
                            }}
                        />
                        {errors?.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                    </div>

                    <div>
                        <Input
                            type="number"
                            min="0"
                            placeholder="Work type"
                            className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors?.work_type ? "border-red-500" : ""}`}
                            onKeyDown={(e) => {
                                if (["-", "e", "E", "+"].includes(e.key)) {
                                    e.preventDefault();
                                }
                            }}
                            onFocus={(e) => e.target.select()}
                            value={form.work_type === 0 ? "" : form.work_type}
                            onChange={(e) => {
                                const val = e.target.value;
                                setForm(prev => ({
                                    ...prev,
                                    work_type: val === "" ? 0 : Math.max(0, parseInt(val, 10)),
                                }))
                            }}
                        />
                        {errors?.work_type && <p className="text-xs text-red-500 mt-1">{errors.work_type}</p>}
                    </div>

                    {/* 👇 2. Замінюємо Input на Select для валюти */}
                    <div>
                        <Select
                            value={form.currency_id === 0 ? "" : String(form.currency_id)}
                            onValueChange={(value) => setForm(prev => ({ ...prev, currency_id: Number(value) }))}
                        >
                            <SelectTrigger className={errors?.currency_id ? "border-red-500" : ""}>
                                <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                                {currencies.map((currency) => (
                                    <SelectItem key={currency.id} value={String(currency.id)}>
                                        {currency.name} {/* Або currency.code, залежно від того, що повертає бекенд */}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors?.currency_id && <p className="text-xs text-red-500 mt-1">{errors.currency_id}</p>}
                    </div>

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