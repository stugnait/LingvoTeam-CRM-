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
import { Plus } from "lucide-react"
import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"
import { TranslatorsFilters } from "@/src/features/translators/components/TranslatorFilter"

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
        languagePairs,
        categories,

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
        languages
    } = useOrders()

    return (
        <>
            <DashboardHeader />

            <main className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-6xl space-y-6">

                    <Tabs
                        defaultValue="translators"
                        className="space-y-6"
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
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">
                                    Translators
                                </h2>
                                <p className="text-muted-foreground">
                                    Manage translators, contacts, and rates
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                <TabsList>
                                    <TabsTrigger value="translators">Translators</TabsTrigger>
                                    <TabsTrigger value="traffic">Traffic</TabsTrigger>
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
                                        Add Traffic
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
                                        languages={languages}
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
                                    <CardTitle>Traffic List</CardTitle>
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
                                        {currency.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors?.currency_id && <p className="text-xs text-red-500 mt-1">{errors.currency_id}</p>}
                    </div>
                </div>
            </BaseFormModal>

            {/* FORM MODAL - ТАРИФ (TRAFFIC) */}
            <BaseFormModal
                open={isTrafficFormOpen}
                onOpenChange={(open) => !open && closeModals()}
                title={selectedTraffic ? "Edit Traffic" : "Create Traffic"}
                submitLabel="Save"
                onSubmit={submitTraffic}
            >
                <div className="space-y-4">

                    <div>
                        <Select
                            value={trafficForm.translator === 0 ? "" : String(trafficForm.translator)}
                            onValueChange={(val) => setTrafficForm(prev => ({ ...prev, translator: Number(val) }))}
                        >
                            <SelectTrigger className={trafficErrors?.translator ? "border-red-500" : ""}>
                                <SelectValue placeholder="Select translator" />
                            </SelectTrigger>
                            <SelectContent>
                                {translators.map((t) => (
                                    <SelectItem key={t.id} value={String(t.id)}>
                                        {t.full_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {trafficErrors?.translator && <p className="text-xs text-red-500 mt-1">{trafficErrors.translator}</p>}
                    </div>

                    <div>
                        <Input
                            placeholder="Traffic Name "
                            value={trafficForm.name || ""}
                            onChange={(e) => setTrafficForm(prev => ({ ...prev, name: e.target.value }))}
                            className={trafficErrors?.name ? "border-red-500" : ""}
                        />
                        {trafficErrors?.name && <p className="text-xs text-red-500 mt-1">{trafficErrors.name}</p>}
                    </div>

                    <div>
                        <Select
                            value={trafficForm.language_pair === null ? "" : String(trafficForm.language_pair)}
                            onValueChange={(val) => setTrafficForm(prev => ({ ...prev, language_pair: Number(val) }))}
                        >
                            <SelectTrigger className={trafficErrors?.language_pair ? "border-red-500" : ""}>
                                <SelectValue placeholder="Select language pair" />
                            </SelectTrigger>
                            <SelectContent>
                                {languagePairs.map((pair) => (
                                    <SelectItem key={pair.id} value={String(pair.id)}>
                                        {pair.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {trafficErrors?.language_pair && <p className="text-xs text-red-500 mt-1">{trafficErrors.language_pair}</p>}
                    </div>

                    <div>
                        <Select
                            value={trafficForm.category === null ? "" : String(trafficForm.category)}
                            onValueChange={(val) => setTrafficForm(prev => ({ ...prev, category: Number(val) }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Category (Optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={String(cat.id)}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Input
                            type="number"
                            step="0.01"
                            placeholder="Rate per page"
                            value={trafficForm.rate_per_page === 0 ? "" : trafficForm.rate_per_page}
                            onChange={(e) => setTrafficForm(prev => ({ ...prev, rate_per_page: Number(e.target.value) }))}
                        />
                    </div>

                    <div>
                        <Input
                            type="number"
                            step="0.01"
                            placeholder="Rate per action"
                            value={trafficForm.rate_per_action === 0 ? "" : trafficForm.rate_per_action}
                            onChange={(e) => setTrafficForm(prev => ({ ...prev, rate_per_action: Number(e.target.value) }))}
                        />
                    </div>

                    <div>
                        <Select
                            value={trafficForm.currency_id === 0 ? "" : String(trafficForm.currency_id)}
                            onValueChange={(val) => setTrafficForm(prev => ({ ...prev, currency_id: Number(val) }))}
                        >
                            <SelectTrigger className={trafficErrors?.currency_id ? "border-red-500" : ""}>
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
                        {trafficErrors?.currency_id && <p className="text-xs text-red-500 mt-1">{trafficErrors.currency_id}</p>}
                    </div>

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
                        : "Are you sure you want to delete this Traffic?"
                }
                confirmLabel="Delete"
                onConfirm={confirmActionHandler}
            />
        </>
    )
}