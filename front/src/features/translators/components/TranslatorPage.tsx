"use client"

import type { ReactNode } from "react"
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

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"

import { TranslatorsTable } from "./TranslatorsTable"
import { TranslatorTrafficTable } from "./TranslatorTrafficTable"
import { Plus, Tag, UserPlus } from "lucide-react"
import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"
import { TranslatorsFilters } from "@/src/features/translators/components/TranslatorFilter"

const modalInputClassName =
    "h-11 rounded-xl border-slate-200 bg-white px-4 text-sm text-slate-950 shadow-none placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-blue-500/25 sm:h-12 sm:text-base"

const modalSelectClassName =
    "h-11 rounded-xl border-slate-200 bg-white px-4 text-sm text-slate-950 shadow-none hover:bg-white hover:border-slate-300 hover:shadow-none focus:ring-blue-500/25 sm:h-12 sm:text-base"

type ModalFieldProps = {
    label: string
    required?: boolean
    error?: string
    className?: string
    children: ReactNode
}

function ModalField({ label, required, error, className, children }: ModalFieldProps) {
    return (
        <div className={className}>
            <label className="mb-2 block text-sm font-semibold text-slate-950">
                {label}
                {required && <span className="ml-1 text-rose-500">*</span>}
            </label>
            {children}
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
    )
}

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

        currencies,
        languages: translatorLanguages,
        languagePairs,
        categories,
        isNewPairModalOpen,
        setIsNewPairModalOpen,
        newPairForm,
        setNewPairForm,
        newPairLoading,
        createAndSelectLanguagePair,

        traffic,
        isTrafficFormOpen,
        trafficForm,
        setTrafficForm,
        trafficErrors,
        selectedTraffic,
        openAddTraffic,
        openEditTraffic,
        openDeleteTraffic,
        submitTraffic,
    } = useTranslators()

    const {
        languages: orderLanguages
    } = useOrders()

    return (
        <>
            <DashboardHeader />

            <main className="flex-1 overflow-y-auto p-3 sm:p-6">
                <div className="w-full min-w-0 space-y-4 sm:space-y-6">

                    <Tabs
                        defaultValue="translators"
                        className="space-y-4 sm:space-y-6"
                        onValueChange={(val) => {
                            if (val === "traffic") {
                                setSearch("")
                                setSourceLanguage(null)
                                setTargetLanguage(null)
                                setOrdering(null)
                            }
                        }}
                    >

                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">
                                    Translators
                                </h2>
                                <p className="text-muted-foreground">
                                    Manage translators, contacts, and rates
                                </p>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                                <TabsList>
                                    <TabsTrigger value="translators">Translators</TabsTrigger>
                                    <TabsTrigger value="traffic">Translator Tariffs</TabsTrigger>
                                </TabsList>

                                <TabsContent value="translators" className="mt-0">
                                    <Button onClick={openAddTranslator}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Translator
                                    </Button>
                                </TabsContent>

                                <TabsContent value="traffic" className="mt-0">
                                    <Button onClick={() => openAddTraffic()}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Tariff
                                    </Button>
                                </TabsContent>
                            </div>
                        </div>

                        {/* ВКЛАДКА: ПЕРЕКЛАДАЧІ */}
                        <TabsContent value="translators" className="space-y-6">
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
                                        languages={orderLanguages}
                                    />
                                </CardContent>
                            </Card>

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
                        </TabsContent>

                        {/* ВКЛАДКА: ТАРИФИ */}
                        <TabsContent value="traffic" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Translator Tariff List</CardTitle>
                                    <CardDescription>
                                        Translator rates by language pair and category
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <TranslatorTrafficTable
                                        traffic={traffic}
                                        onEdit={openEditTraffic}
                                        onDelete={openDeleteTraffic}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                    </Tabs>
                </div>
            </main>

            {/* FORM MODAL - ПЕРЕКЛАДАЧ */}
            <BaseFormModal
                open={isFormOpen}
                onOpenChange={(open) => !open && closeModals()}
                title={
                    selectedTranslator
                        ? "Edit Translator"
                        : "Create Translator"
                }
                description={selectedTranslator ? "Update translator details." : "Add a new translator to your team."}
                icon={<UserPlus className="h-8 w-8" />}
                variant="reference"
                submitLabel="Save"
                onSubmit={() => submitTranslator(form)}
            >
                <div className="space-y-4 sm:space-y-5">
                    <ModalField label="Full name" required error={errors?.full_name}>
                        <Input
                            placeholder="Enter full name"
                            value={form.full_name}
                            autoFocus
                            className={`${modalInputClassName} ${errors?.full_name ? "border-red-500" : ""}`}
                            onChange={(e) =>
                                setForm(prev => ({
                                    ...prev,
                                    full_name: e.target.value,
                                    }))
                            }
                        />
                    </ModalField>

                    <ModalField label="Email" required error={errors?.email}>
                        <Input
                            placeholder="Enter email address"
                            value={form.email}
                            className={`${modalInputClassName} ${errors?.email ? "border-red-500" : ""}`}
                            onChange={(e) =>
                                setForm(prev => ({
                                    ...prev,
                                    email: e.target.value,
                                    }))
                            }
                        />
                    </ModalField>

                    <ModalField label="Phone" required error={errors?.phone}>
                        <PatternFormat
                            format="+38 (###) ###-##-##"
                            allowEmptyFormatting
                            mask="_"
                            value={form.phone}
                            customInput={Input}
                            type="tel"
                            placeholder="+38 (___) ___-__-__"
                            className={`${modalInputClassName} ${errors?.phone ? "border-red-500" : ""}`}
                            onValueChange={(values) => {
                                setForm(prev => ({
                                    ...prev,
                                    phone: values.formattedValue,
                                    }))
                            }}
                        />
                    </ModalField>


                    <ModalField label="Currency" required error={errors?.currency_id}>
                        <Select
                            value={form.currency_id === 0 ? "" : String(form.currency_id)}
                            onValueChange={(value) => setForm(prev => ({ ...prev, currency_id: Number(value) }))}
                        >
                            <SelectTrigger className={`${modalSelectClassName} ${errors?.currency_id ? "border-red-500" : ""}`}>
                                <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                                {currencies.map((currency) => (
                                    <SelectItem key={currency.id} value={String(currency.id)}>
                                        {currency.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </ModalField>
                </div>
            </BaseFormModal>

            {/* FORM MODAL - ТАРИФ (TRAFFIC) */}
            <BaseFormModal
                open={isTrafficFormOpen}
                onOpenChange={(open) => !open && closeModals()}
                title={selectedTraffic ? "Edit Translator Tariff" : "Add Translator Tariff"}
                description={selectedTraffic ? "Update the translator tariff for your services." : "Create a new tariff for translator services."}
                icon={<Tag className="h-8 w-8" />}
                variant="reference"
                submitLabel={selectedTraffic ? "Save" : "Create"}
                onSubmit={submitTraffic}
            >
                <div className="space-y-4">

                    <ModalField label="Tariff name" required error={trafficErrors?.name}>
                        <Input
                            placeholder="Enter tariff name"
                            value={trafficForm.name || ""}
                            onChange={(e) => setTrafficForm(prev => ({ ...prev, name: e.target.value }))}
                            className={`${modalInputClassName} ${trafficErrors?.name ? "border-red-500" : ""}`}
                        />
                    </ModalField>

                    <ModalField label="Translator" required error={trafficErrors?.translator}>
                        <Select
                            value={trafficForm.translator === 0 ? "" : String(trafficForm.translator)}
                            onValueChange={(val) => setTrafficForm(prev => ({ ...prev, translator: Number(val) }))}
                        >
                            <SelectTrigger className={`${modalSelectClassName} ${trafficErrors?.translator ? "border-red-500" : ""}`}>
                                <SelectValue placeholder="Select translator" />
                            </SelectTrigger>
                            <SelectContent searchable searchPlaceholder="Search translator...">
                                {translators.map((t) => (
                                    <SelectItem key={t.id} value={String(t.id)}>
                                        {t.full_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </ModalField>

                    <ModalField label="Language pair" required error={trafficErrors?.language_pair}>
                        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
                            <Select
                                value={trafficForm.language_pair === null ? "" : String(trafficForm.language_pair)}
                                onValueChange={(val) => setTrafficForm(prev => ({ ...prev, language_pair: Number(val) }))}
                            >
                                <SelectTrigger className={`${modalSelectClassName} ${trafficErrors?.language_pair ? "border-red-500" : ""}`}>
                                    <SelectValue placeholder="Choose language pair" />
                                </SelectTrigger>
                                <SelectContent searchable searchPlaceholder="Search language pair...">
                                    {languagePairs.map((pair) => (
                                        <SelectItem key={pair.id} value={String(pair.id)}>
                                            {pair.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsNewPairModalOpen(true)}
                                className="h-11 w-full rounded-xl border-blue-200 px-4 text-sm font-semibold text-blue-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 sm:h-12 sm:w-auto"
                            >
                                <Plus className="mr-2 h-5 w-5" />
                                Нова пара
                            </Button>
                        </div>
                    </ModalField>

                    <ModalField label="Currency" error={trafficErrors?.currency_id}>
                        <Select
                            value={trafficForm.currency_id === 0 ? "" : String(trafficForm.currency_id)}
                            onValueChange={(val) => setTrafficForm(prev => ({ ...prev, currency_id: Number(val) }))}
                        >
                            <SelectTrigger className={`${modalSelectClassName} ${trafficErrors?.currency_id ? "border-red-500" : ""}`}>
                                <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                                {currencies.map((currency) => (
                                    <SelectItem key={currency.id} value={String(currency.id)}>
                                        {currency.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </ModalField>

                    <ModalField label="Select category">
                        <Select
                            value={trafficForm.category === null ? "" : String(trafficForm.category)}
                            onValueChange={(val) => setTrafficForm(prev => ({ ...prev, category: Number(val) }))}
                        >
                            <SelectTrigger className={modalSelectClassName}>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={String(cat.id)}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </ModalField>

                    <ModalField label="Price per page">
                        <Input
                            type="number"
                            step="0.01"
                            placeholder="Enter price per page"
                            value={trafficForm.rate_per_page === 0 ? "" : trafficForm.rate_per_page}
                            onChange={(e) => setTrafficForm(prev => ({ ...prev, rate_per_page: Number(e.target.value) }))}
                            className={modalInputClassName}
                        />
                    </ModalField>

                    <ModalField label="Price per action">
                        <Input
                            type="number"
                            step="0.01"
                            placeholder="Enter price per action"
                            value={trafficForm.rate_per_action === 0 ? "" : trafficForm.rate_per_action}
                            onChange={(e) => setTrafficForm(prev => ({ ...prev, rate_per_action: Number(e.target.value) }))}
                            className={modalInputClassName}
                        />
                    </ModalField>

                </div>
            </BaseFormModal>

            <BaseFormModal
                open={isNewPairModalOpen}
                onOpenChange={(open) => {
                    setIsNewPairModalOpen(open)
                    if (!open) {
                        setNewPairForm({ source_language: 0, target_language: 0 })
                    }
                }}
                title="Нова мовна пара"
                submitLabel={newPairLoading ? "Creating..." : "Create"}
                isLoading={newPairLoading}
                onSubmit={createAndSelectLanguagePair}
            >
                <div className="space-y-4">
                    <ModalField label="Мова джерела" required>
                        <Select
                            value={newPairForm.source_language ? String(newPairForm.source_language) : ""}
                            onValueChange={(val) =>
                                setNewPairForm(prev => ({ ...prev, source_language: Number(val) }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Оберіть мову" />
                            </SelectTrigger>
                            <SelectContent searchable searchPlaceholder="Search language...">
                                {translatorLanguages.map((language) => (
                                    <SelectItem key={language.id} value={String(language.id)}>
                                        {language.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </ModalField>

                    <ModalField label="Мова перекладу" required>
                        <Select
                            value={newPairForm.target_language ? String(newPairForm.target_language) : ""}
                            onValueChange={(val) =>
                                setNewPairForm(prev => ({ ...prev, target_language: Number(val) }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Оберіть мову" />
                            </SelectTrigger>
                            <SelectContent searchable searchPlaceholder="Search language...">
                                {translatorLanguages
                                    .filter((language) => language.id !== newPairForm.source_language)
                                    .map((language) => (
                                        <SelectItem key={language.id} value={String(language.id)}>
                                            {language.name}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </ModalField>
                </div>
            </BaseFormModal>

            {/* DELETE CONFIRM */}
            <ConfirmModal
                open={isConfirmOpen}
                onOpenChange={(open) => !open && closeModals()}
                title="Confirm deletion"
                description={
                    selectedTranslator
                        ? `Are you sure you want to delete "${selectedTranslator.full_name}"?`
                        : "Are you sure you want to delete this translator tariff?"
                }
                confirmLabel="Delete"
                onConfirm={confirmActionHandler}
            />
        </>
    )
}
