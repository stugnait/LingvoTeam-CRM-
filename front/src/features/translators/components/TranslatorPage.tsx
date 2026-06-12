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
import { useI18n } from "@/src/shared/i18n/I18nProvider"

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
    const { t } = useI18n()
    const {
        translators,

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

        isInlineTrafficOpen,
        setIsInlineTrafficOpen,
        inlineTrafficForm,
        setInlineTrafficForm,
        inlineTrafficLoading,
        createAndSelectTraffic,
    } = useTranslators()

    const { languages: orderLanguages } = useOrders()

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
                                <h2 className="text-2xl font-bold tracking-tight">{t("translators.title")}</h2>
                                <p className="text-muted-foreground">{t("translators.description")}</p>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                                <TabsList>
                                    <TabsTrigger value="translators">{t("translators.title")}</TabsTrigger>
                                    <TabsTrigger value="traffic">{t("translators.tariffsTab")}</TabsTrigger>
                                </TabsList>

                                <TabsContent value="translators" className="mt-0">
                                    <Button onClick={openAddTranslator}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        {t("translators.add")}
                                    </Button>
                                </TabsContent>

                                <TabsContent value="traffic" className="mt-0">
                                    <Button onClick={() => openAddTraffic()}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        {t("translators.addTariff")}
                                    </Button>
                                </TabsContent>
                            </div>
                        </div>

                        {/* ВКЛАДКА: ПЕРЕКЛАДАЧІ */}
                        <TabsContent value="translators" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t("common.filters")}</CardTitle>
                                    <CardDescription>{t("translators.filtersDescription")}</CardDescription>
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
                                    <CardTitle>{t("translators.listTitle")}</CardTitle>
                                    <CardDescription>{t("translators.listDescription")}</CardDescription>
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
                                    <CardTitle>{t("translators.tariffListTitle")}</CardTitle>
                                    <CardDescription>{t("translators.tariffListDescription")}</CardDescription>
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

            {/* ─── MODAL: ПЕРЕКЛАДАЧ ─── */}
            <BaseFormModal
                open={isFormOpen}
                onOpenChange={(open) => !open && closeModals()}
                title={selectedTranslator ? t("translators.edit") : t("translators.create")}
                description={selectedTranslator ? t("translators.updateDescription") : t("translators.createDescription")}
                icon={<UserPlus className="h-8 w-8" />}
                variant="reference"
                submitLabel={t("common.save")}
                onSubmit={() => submitTranslator(form)}
            >
                <div className="space-y-4 sm:space-y-5">
                    <ModalField label={t("orders.fullName")} required error={errors?.full_name}>
                        <Input
                            placeholder={t("translators.enterFullName")}
                            value={form.full_name}
                            autoFocus
                            className={`${modalInputClassName} ${errors?.full_name ? "border-red-500" : ""}`}
                            onChange={(e) => setForm(prev => ({ ...prev, full_name: e.target.value }))}
                        />
                    </ModalField>

                    <ModalField label={t("auth.email")} required error={errors?.email}>
                        <Input
                            placeholder={t("translators.enterEmail")}
                            value={form.email}
                            className={`${modalInputClassName} ${errors?.email ? "border-red-500" : ""}`}
                            onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                        />
                    </ModalField>

                    <ModalField label={t("common.tariffs")}>
                        <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 p-3 space-y-2">
                            {traffic.length === 0 ? (
                                <p className="text-sm text-slate-500">{t("translators.noTariffsAvailable")}</p>
                            ) : (
                                traffic.map((tariff) => (
                                    <label
                                        key={tariff.id}
                                        className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={form.tariff_ids.includes(tariff.id)}
                                            onChange={(e) => {
                                                setForm(prev => ({
                                                    ...prev,
                                                    tariff_ids: e.target.checked
                                                        ? [...prev.tariff_ids, tariff.id]
                                                        : prev.tariff_ids.filter(id => id !== tariff.id),
                                                }))
                                            }}
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-medium">{tariff.name}</span>
                                            <span className="text-xs text-slate-500">{tariff.language_pair_name}</span>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsInlineTrafficOpen(true)}
                            className="mt-2 w-full rounded-xl border-blue-200 text-sm font-semibold text-blue-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            {t("translators.newTariff")}
                        </Button>
                    </ModalField>

                    <ModalField label={t("profile.phone")} required error={errors?.phone}>
                        <PatternFormat
                            format="+38 (###) ###-##-##"
                            allowEmptyFormatting
                            mask="_"
                            value={form.phone}
                            customInput={Input}
                            type="tel"
                            placeholder="+38 (___) ___-__-__"
                            className={`${modalInputClassName} ${errors?.phone ? "border-red-500" : ""}`}
                            onValueChange={(values) => setForm(prev => ({ ...prev, phone: values.formattedValue }))}
                        />
                    </ModalField>

                    <ModalField label={t("orders.currency")} required error={errors?.currency_id}>
                        <Select
                            value={form.currency_id === 0 ? "" : String(form.currency_id)}
                            onValueChange={(value) => setForm(prev => ({ ...prev, currency_id: Number(value) }))}
                        >
                            <SelectTrigger className={`${modalSelectClassName} ${errors?.currency_id ? "border-red-500" : ""}`}>
                                <SelectValue placeholder={t("orders.selectCurrency")} />
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

            {/* ─── MODAL: ТАРИФ (з вкладки Tariffs) ─── */}
            <BaseFormModal
                open={isTrafficFormOpen}
                onOpenChange={(open) => !open && closeModals()}
                title={selectedTraffic ? t("translators.editTariff") : t("translators.createTariff")}
                description={selectedTraffic ? t("translators.updateTariffDescription") : t("translators.createTariffDescription")}
                icon={<Tag className="h-8 w-8" />}
                variant="reference"
                submitLabel={selectedTraffic ? t("common.save") : t("common.create")}
                onSubmit={submitTraffic}
            >
                <div className="space-y-4">
                    <ModalField label={t("translators.tariffName")} required error={trafficErrors?.name}>
                        <Input
                            placeholder={t("translators.enterTariffName")}
                            value={trafficForm.name || ""}
                            onChange={(e) => setTrafficForm(prev => ({ ...prev, name: e.target.value }))}
                            className={`${modalInputClassName} ${trafficErrors?.name ? "border-red-500" : ""}`}
                        />
                    </ModalField>

                    <ModalField label={t("common.languagePair")} required error={trafficErrors?.language_pair}>
                        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
                            <Select
                                value={trafficForm.language_pair === null ? "" : String(trafficForm.language_pair)}
                                onValueChange={(val) => setTrafficForm(prev => ({ ...prev, language_pair: Number(val) }))}
                            >
                                <SelectTrigger className={`${modalSelectClassName} ${trafficErrors?.language_pair ? "border-red-500" : ""}`}>
                                    <SelectValue placeholder={t("common.chooseLanguagePair")} />
                                </SelectTrigger>
                                <SelectContent searchable searchPlaceholder={t("common.searchLanguagePair")}>
                                    {languagePairs.map((pair) => (
                                        <SelectItem key={pair.id} value={String(pair.id)}>{pair.name}</SelectItem>
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
                                {t("translators.newLanguagePair")}
                            </Button>
                        </div>
                    </ModalField>

                    <ModalField label={t("orders.currency")} error={trafficErrors?.currency_id}>
                        <Select
                            value={trafficForm.currency_id === 0 ? "" : String(trafficForm.currency_id)}
                            onValueChange={(val) => setTrafficForm(prev => ({ ...prev, currency_id: Number(val) }))}
                        >
                            <SelectTrigger className={`${modalSelectClassName} ${trafficErrors?.currency_id ? "border-red-500" : ""}`}>
                                <SelectValue placeholder={t("orders.selectCurrency")} />
                            </SelectTrigger>
                            <SelectContent>
                                {currencies.map((currency) => (
                                    <SelectItem key={currency.id} value={String(currency.id)}>{currency.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </ModalField>

                    <ModalField label={t("orders.category")}>
                        <Select
                            value={trafficForm.category === null ? "" : String(trafficForm.category)}
                            onValueChange={(val) => setTrafficForm(prev => ({ ...prev, category: Number(val) }))}
                        >
                            <SelectTrigger className={modalSelectClassName}>
                                <SelectValue placeholder={t("clients.selectCategory")} />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </ModalField>

                    <ModalField label={t("translators.pricePerPage")}>
                        <Input
                            type="number"
                            step="0.01"
                            placeholder={t("translators.pricePerPage")}
                            value={trafficForm.rate_per_page === 0 ? "" : trafficForm.rate_per_page}
                            onChange={(e) => setTrafficForm(prev => ({ ...prev, rate_per_page: Number(e.target.value) }))}
                            className={modalInputClassName}
                        />
                    </ModalField>

                    <ModalField label={t("translators.pricePerAction")}>
                        <Input
                            type="number"
                            step="0.01"
                            placeholder={t("translators.pricePerAction")}
                            value={trafficForm.rate_per_action === 0 ? "" : trafficForm.rate_per_action}
                            onChange={(e) => setTrafficForm(prev => ({ ...prev, rate_per_action: Number(e.target.value) }))}
                            className={modalInputClassName}
                        />
                    </ModalField>
                </div>
            </BaseFormModal>

            {/* ─── MODAL: INLINE НОВИЙ ТАРИФ (з модалки перекладача) ─── */}
            <BaseFormModal
                open={isInlineTrafficOpen}
                onOpenChange={(open) => {
                    setIsInlineTrafficOpen(open)
                    if (!open) {
                        setInlineTrafficForm({ name: "", currency_id: 0, language_pair: null, category: null, rate_per_page: 0, rate_per_action: 0 })
                    }
                }}
                title={t("translators.newTariff")}
                description={t("translators.newTariffDescription")}
                icon={<Tag className="h-8 w-8" />}
                variant="reference"
                submitLabel={inlineTrafficLoading ? t("tariffs.creating") : t("common.create")}
                isLoading={inlineTrafficLoading}
                onSubmit={createAndSelectTraffic}
            >
                <div className="space-y-4">
                    <ModalField label={t("translators.tariffName")} required>
                        <Input
                            placeholder={t("translators.enterTariffName")}
                            value={inlineTrafficForm.name || ""}
                            onChange={(e) => setInlineTrafficForm(prev => ({ ...prev, name: e.target.value }))}
                            className={modalInputClassName}
                        />
                    </ModalField>

                    <ModalField label={t("common.languagePair")} required>
                        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
                            <Select
                                value={inlineTrafficForm.language_pair === null ? "" : String(inlineTrafficForm.language_pair)}
                                onValueChange={(val) => setInlineTrafficForm(prev => ({ ...prev, language_pair: Number(val) }))}
                            >
                                <SelectTrigger className={modalSelectClassName}>
                                    <SelectValue placeholder={t("common.chooseLanguagePair")} />
                                </SelectTrigger>
                                <SelectContent searchable searchPlaceholder={t("common.searchLanguagePair")}>
                                    {languagePairs.map((pair) => (
                                        <SelectItem key={pair.id} value={String(pair.id)}>{pair.name}</SelectItem>
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
                                {t("translators.newLanguagePair")}
                            </Button>
                        </div>
                    </ModalField>

                    <ModalField label={t("orders.currency")}>
                        <Select
                            value={inlineTrafficForm.currency_id === 0 ? "" : String(inlineTrafficForm.currency_id)}
                            onValueChange={(val) => setInlineTrafficForm(prev => ({ ...prev, currency_id: Number(val) }))}
                        >
                            <SelectTrigger className={modalSelectClassName}>
                                <SelectValue placeholder={t("orders.selectCurrency")} />
                            </SelectTrigger>
                            <SelectContent>
                                {currencies.map((currency) => (
                                    <SelectItem key={currency.id} value={String(currency.id)}>{currency.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </ModalField>

                    <ModalField label={t("orders.category")}>
                        <Select
                            value={inlineTrafficForm.category === null ? "" : String(inlineTrafficForm.category)}
                            onValueChange={(val) => setInlineTrafficForm(prev => ({ ...prev, category: Number(val) }))}
                        >
                            <SelectTrigger className={modalSelectClassName}>
                                <SelectValue placeholder={t("clients.selectCategory")} />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </ModalField>

                    <ModalField label={t("translators.pricePerPage")}>
                        <Input
                            type="number"
                            step="0.01"
                            placeholder={t("translators.pricePerPage")}
                            value={inlineTrafficForm.rate_per_page === 0 ? "" : inlineTrafficForm.rate_per_page}
                            onChange={(e) => setInlineTrafficForm(prev => ({ ...prev, rate_per_page: Number(e.target.value) }))}
                            className={modalInputClassName}
                        />
                    </ModalField>

                    <ModalField label={t("translators.pricePerAction")}>
                        <Input
                            type="number"
                            step="0.01"
                            placeholder={t("translators.pricePerAction")}
                            value={inlineTrafficForm.rate_per_action === 0 ? "" : inlineTrafficForm.rate_per_action}
                            onChange={(e) => setInlineTrafficForm(prev => ({ ...prev, rate_per_action: Number(e.target.value) }))}
                            className={modalInputClassName}
                        />
                    </ModalField>
                </div>
            </BaseFormModal>

            {/* ─── MODAL: НОВА МОВНА ПАРА ─── */}
            <BaseFormModal
                open={isNewPairModalOpen}
                onOpenChange={(open) => {
                    setIsNewPairModalOpen(open)
                    if (!open) {
                        setNewPairForm({ source_language: 0, target_language: 0 })
                    }
                }}
                title={t("translators.newLanguagePair")}
                submitLabel={newPairLoading ? t("tariffs.creating") : t("common.create")}
                isLoading={newPairLoading}
                onSubmit={createAndSelectLanguagePair}
            >
                <div className="space-y-4">
                    <ModalField label={t("common.sourceLanguage")} required>
                        <Select
                            value={newPairForm.source_language ? String(newPairForm.source_language) : ""}
                            onValueChange={(val) => setNewPairForm(prev => ({ ...prev, source_language: Number(val) }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={t("common.chooseLanguage")} />
                            </SelectTrigger>
                            <SelectContent searchable searchPlaceholder={t("common.searchLanguage")}>
                                {translatorLanguages.map((language) => (
                                    <SelectItem key={language.id} value={String(language.id)}>{language.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </ModalField>

                    <ModalField label={t("common.targetLanguage")} required>
                        <Select
                            value={newPairForm.target_language ? String(newPairForm.target_language) : ""}
                            onValueChange={(val) => setNewPairForm(prev => ({ ...prev, target_language: Number(val) }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={t("common.chooseLanguage")} />
                            </SelectTrigger>
                            <SelectContent searchable searchPlaceholder={t("common.searchLanguage")}>
                                {translatorLanguages
                                    .filter((language) => language.id !== newPairForm.source_language)
                                    .map((language) => (
                                        <SelectItem key={language.id} value={String(language.id)}>{language.name}</SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </ModalField>
                </div>
            </BaseFormModal>

            {/* ─── MODAL: DELETE CONFIRM ─── */}
            <ConfirmModal
                open={isConfirmOpen}
                onOpenChange={(open) => !open && closeModals()}
                title={t("translators.deleteTitle")}
                description={
                    selectedTranslator
                        ? t("translators.deleteDescription", { name: selectedTranslator.full_name })
                        : t("translators.deleteTariffDescription")
                }
                confirmLabel={t("common.delete")}
                onConfirm={confirmActionHandler}
            />
        </>
    )
}
