"use client"

import { useState, useEffect, useMemo } from "react"
import { WizardModal } from "@/src/components/modals/wizard/WizardModal"
import { WizardStep } from "@/src/components/modals/wizard/WizardStep"
import { PatternFormat } from 'react-number-format'
import {
    User,
    Tag,
    Users,
    CalendarClock,
    MessageSquare,
    DollarSign,
    BarChart2,
} from "lucide-react"

import { useTranslators } from "@/src/features/translators/hooks/useTranslators"
import { BaseFormModal } from "@/src/components/modals/BaseFormModal"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"
import { UserPlus } from "lucide-react"

import { Combobox } from "@/src/components/ui/Combobox"
import { TranslatorSelect } from "@/src/components/ui/TranslatorSelect"
import { FileUpload } from "@/src/components/ui/FileUpload"
import { DeadlineSelector } from "@/src/components/ui/DeadlineSelector"
import type { Priority } from "@/src/components/ui/PrioritySelector"
import { PrioritySelector } from "@/src/components/ui/PrioritySelector"
import { useOrderAnalysis } from "@/src/features/orders/hooks/useOrderAnalysis"
import { ordersApi } from "@/src/features/orders/api"
import localforage from "localforage"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

// ─── Meta types ─────────────────────────────────────────────────────────────

interface TariffMeta {
    category?: string
    price_per_page?: number | null
    price_per_action?: number | null
}

interface TranslatorTrafficMeta {
    rate_per_page?: number | null
    rate_per_action?: number | null
    currency?: string
    isProfitable?: boolean
    marginStr?: string | null
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface CreateOrderModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: () => void
    loading: boolean

    mode?: "create" | "edit"
    orderId?: number

    clientId: string
    setClientId: (value: string) => void
    files: File[]
    setFiles: (files: File[]) => void
    sourceLanguage: string
    setSourceLanguage: (value: string) => void
    targetLanguage: string
    setTargetLanguage: (value: string) => void

    trafficId: string
    setTrafficId: (value: string) => void
    currencyId: string
    setCurrencyId: (value: string) => void

    selectedTranslatorId: number | null
    setSelectedTranslatorId: (id: number | null) => void
    editor: string
    setEditor: (value: string) => void
    translatorTrafficId: string
    setTranslatorTrafficId: (value: string) => void

    clients: any[]
    languages: any[]
    editors: any[]
    currencies: any[]
    translators: any[]
    tariffs: any[]

    managerAccept: string
    setManagerAccept: (value: string) => void
    managerDelivery: string
    setManagerDelivery: (value: string) => void

    managers: any[]

    deadline: Date | undefined
    setDeadline: (date: Date | undefined) => void
    comment: string
    setComment: (value: string) => void
    priority: Priority | undefined
    setPriority: (value: Priority) => void
    onRefreshTranslators?: () => Promise<any[]>
    totalAmount: string
    setTotalAmount: (value: string) => void
}

type EditorOption = {
    value: string
    label: string
    description?: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CreateOrderModal(props: CreateOrderModalProps) {
    const { t } = useI18n()

    const {
        open, onOpenChange, onSubmit, loading,
        clientId, setClientId,
        files, setFiles,
        mode = "create", orderId,
        sourceLanguage, setSourceLanguage,
        targetLanguage, setTargetLanguage,
        trafficId, setTrafficId,
        currencyId, setCurrencyId,
        selectedTranslatorId, setSelectedTranslatorId,
        editor, setEditor,
        translatorTrafficId, setTranslatorTrafficId,
        clients, languages, editors, currencies, translators, tariffs,
        deadline, setDeadline,
        comment, setComment,
        priority, setPriority,
        onRefreshTranslators,
        managerAccept, setManagerAccept,
        managerDelivery, setManagerDelivery,
        managers,
        totalAmount, setTotalAmount,
    } = props

    const { form, setForm, isFormOpen, openAddTranslator, closeModals, submitTranslator } = useTranslators()

    const {
        calculateStats, statsResult, statsLoading,
        analyzeOrderFiles, analysisResult, analysisLoading,
        resetStats
    } = useOrderAnalysis()

    const [currentStep, setCurrentStep] = useState(0)
    const [filesConfirmed, setFilesConfirmed] = useState(false)
    const [imagesAnalyzed, setImagesAnalyzed] = useState(false)
    const [editorOptions, setEditorOptions] = useState<EditorOption[]>([])
    const [priceData, setPriceData] = useState<any>(null)
    const [priceLoading, setPriceLoading] = useState(false)
    const [useManualPrice, setUseManualPrice] = useState(false)
    const [customDiscount, setCustomDiscount] = useState<string>("")
    const [isRestored, setIsRestored] = useState(false)

    // --- Логіка підрахунку знижки ---
    const selectedClient = clients.find((c) => String(c.id) === clientId)
    const defaultDiscountPercent = selectedClient?.discount_percent ? Number(selectedClient.discount_percent) : 0

    const activeDiscount = customDiscount !== "" ? Number(customDiscount) : defaultDiscountPercent

    const baseAutoPrice = priceData?.total_client_price ? parseFloat(priceData.total_client_price) : 0
    const discountedAutoPrice = activeDiscount > 0 && baseAutoPrice > 0
        ? (baseAutoPrice * (1 - activeDiscount / 100)).toFixed(2)
        : priceData?.total_client_price ?? ""

    useEffect(() => {
        if (!useManualPrice && discountedAutoPrice) {
            setTotalAmount(String(discountedAutoPrice))
        }
    }, [discountedAutoPrice, useManualPrice, setTotalAmount])

    const effectivePrice = totalAmount || discountedAutoPrice || "-"

    // ─── Handlers ───────────────────────────────────────────────────────────

    const handleQuickCreateTranslator = async () => {
        await submitTranslator(form)

        if (onRefreshTranslators) {
            const freshTranslators = await onRefreshTranslators()
            if (Array.isArray(freshTranslators) && freshTranslators.length > 0) {
                const newTranslator = freshTranslators.find((t: any) => t.email === form.email)
                if (newTranslator) {
                    setSelectedTranslatorId(newTranslator.id)
                    if (newTranslator.traffic && newTranslator.traffic.length > 0) {
                        setTranslatorTrafficId(String(newTranslator.traffic[0].id))
                    }
                }
            }
        }
        closeModals()
    }

    const DRAFT_KEY = "create_order_draft"

    useEffect(() => {
        if (!open) {
            setIsRestored(false)
            return
        }
        if (mode === "edit") {
            setIsRestored(true)
            return
        }

        const restoreDraft = async () => {
            try {
                const d = await localforage.getItem<any>(DRAFT_KEY)
                if (d) {
                    if (d.clientId) { setClientId(d.clientId) }
                    if (d.sourceLanguage) { setSourceLanguage(d.sourceLanguage) }
                    if (d.targetLanguage) { setTargetLanguage(d.targetLanguage) }
                    if (d.trafficId) { setTrafficId(d.trafficId) }
                    if (d.currencyId) { setCurrencyId(d.currencyId) }
                    if (d.editor) { setEditor(d.editor) }
                    if (d.managerAccept) { setManagerAccept(d.managerAccept) }
                    if (d.managerDelivery) { setManagerDelivery(d.managerDelivery) }
                    if (d.selectedTranslatorId) { setSelectedTranslatorId(d.selectedTranslatorId) }
                    if (d.translatorTrafficId) { setTranslatorTrafficId(d.translatorTrafficId) }
                    if (d.comment) { setComment(d.comment) }
                    if (d.priority) { setPriority(d.priority) }
                    if (d.deadline) { setDeadline(new Date(d.deadline)) }
                    if (d.customDiscount) { setCustomDiscount(d.customDiscount) }
                    if (d.totalAmount) { setTotalAmount(d.totalAmount) }
                    if (d.currentStep !== undefined) { setCurrentStep(d.currentStep) }
                    if (d.files && Array.isArray(d.files)) {
                        setFiles(d.files)
                        if (d.filesConfirmed) {
                            calculateStats(d.files)
                                .then(() => setFilesConfirmed(true))
                                .catch(err => console.error("Помилка фонового підрахунку:", err))
                        }
                    }
                }
            } catch (e) {
                console.error("Помилка відновлення чернетки з localforage:", e)
            } finally {
                setIsRestored(true)
            }
        }

        restoreDraft()
    }, [open, mode])

    useEffect(() => {
        if (!open || mode === "edit" || !isRestored) { return }

        const saveDraft = async () => {
            const draft = {
                clientId, sourceLanguage, targetLanguage,
                trafficId, currencyId, editor,
                managerAccept, managerDelivery,
                selectedTranslatorId, translatorTrafficId,
                comment, priority,
                deadline: deadline?.toISOString(),
                customDiscount, totalAmount,
                filesConfirmed,
                files,
                currentStep,
            }
            try {
                await localforage.setItem(DRAFT_KEY, draft)
            } catch (e) {
                console.error("Помилка збереження чернетки:", e)
            }
        }
        saveDraft()
    }, [
        clientId, sourceLanguage, targetLanguage, trafficId, currencyId,
        editor, managerAccept, managerDelivery, selectedTranslatorId,
        translatorTrafficId, comment, priority, deadline,
        customDiscount, totalAmount, files, filesConfirmed, currentStep, open, isRestored, mode,
    ])

    const handleModalClose = (open: boolean) => {
        if (!open) {
            resetStats()
            setFilesConfirmed(false)
            setImagesAnalyzed(false)
            setPriceData(null)
            setUseManualPrice(false)
            setCurrentStep(0)
        }
        onOpenChange(open)
    }

    const handleConfirmFiles = async () => {
        if (!files.length) { return }
        await calculateStats(files)
        setFilesConfirmed(true)
    }

    const handleCalculatePrice = async () => {
        if (!files.length || !trafficId) { return }
        try {
            setPriceLoading(true)
            const formData = new FormData()
            files.forEach(f => formData.append("files", f))
            formData.append("traffic_id", trafficId)
            if (selectedTranslatorId) { formData.append("translator_id", String(selectedTranslatorId)) }
            if (translatorTrafficId) { formData.append("translator_traffic_id", translatorTrafficId) }
            const res = await ordersApi.previewPrice(formData)
            setPriceData(res)
        } catch (e) {
            console.error(e)
        } finally {
            setPriceLoading(false)
        }
    }

    const handleAnalyzeImages = async () => {
        if (!files.length) { return }
        await analyzeOrderFiles(files, sourceLanguage ? Number(sourceLanguage) : undefined)
        setImagesAnalyzed(true)
    }

    const handleOrderSubmit = async () => {
        try {
            await localforage.removeItem(DRAFT_KEY)
        } catch (error) {
            console.error("Помилка видалення чернетки:", error)
        }
        onSubmit()
    }

    // ─── Validation ─────────────────────────────────────────────────────────

    const stepValidation = (step: number): boolean => {
        switch (step) {
            case 0:
                return !!clientId && !!sourceLanguage && !!targetLanguage && files.length > 0 && filesConfirmed
            case 1:
                return !!trafficId && !!currencyId
            case 2: {
                const isTranslatorValid = selectedTranslatorId ? !!translatorTrafficId : true
                return isTranslatorValid && !!editor && !!managerAccept && !!managerDelivery
            }
            case 3:
                return !!deadline && !!priority && !!comment.trim()
            case 4:
                return true
            default:
                return true
        }
    }

    const stepError = (step: number): string | null => {
        switch (step) {
            case 0:
                if (!clientId) { return t("orders.validation.selectClient") }
                if (!sourceLanguage) { return t("orders.validation.selectSourceLanguage") }
                if (!targetLanguage) { return t("orders.validation.selectTargetLanguage") }
                if (!files.length) { return t("orders.validation.uploadFile") }
                if (!filesConfirmed) { return t("orders.confirmFilesValidation", { button: t("orders.confirmFiles") }) }
                return null
            case 1:
                if (!trafficId) { return t("orders.validation.selectTariff") }
                if (!currencyId) { return t("orders.validation.selectCurrency") }
                return null
            case 2:
                if (selectedTranslatorId && !translatorTrafficId) { return t("orders.validation.selectTranslatorTariff") }
                if (!editor) { return t("orders.validation.selectEditor") }
                if (!managerAccept) { return t("orders.validation.selectAcceptManager") }
                if (!managerDelivery) { return t("orders.validation.selectDeliveryManager") }
                return null
            case 3:
                if (!priority) { return t("orders.validation.selectPriority") }
                if (!deadline) { return t("orders.validation.setDeadline") }
                if (!comment.trim()) { return t("orders.validation.addComment") }
                return null
            case 4:
                return null
            default:
                return null
        }
    }

    // ─── Effects & Memo ─────────────────────────────────────────────────────

    useEffect(() => {
        if (!trafficId) { return }
        const selectedTariff = tariffs?.find((t) => String(t.id) === trafficId)
        if (selectedTariff?.currency_id) {
            setCurrencyId(String(selectedTariff.currency_id))
        }
    }, [trafficId, tariffs, setCurrencyId])

    useEffect(() => {
        if (!sourceLanguage || !targetLanguage) {
            setEditorOptions(editors.map((ed) => ({ value: String(ed.id), label: ed.full_name })))
            return
        }

        let cancelled = false
        ordersApi
            .getEditorsByLanguagePair(Number(sourceLanguage), Number(targetLanguage))
            .then((res: any) => {
                if (cancelled) { return }
                const results = Array.isArray(res?.results) ? res.results : []
                setEditorOptions(
                    results.map((r: any) => ({
                        value: String(r.editor_id),
                        label: `${r.editor_name ?? `Editor #${r.editor_id}`} (${r.language_pair_label})`,
                        description: r.editor_language_pair_id ? "Є мовна пара" : "Нема мовної пари",
                    }))
                )
            })
            .catch(() => {
                if (cancelled) { return }
                setEditorOptions(editors.map((ed) => ({ value: String(ed.id), label: ed.full_name })))
            })

        return () => { cancelled = true }
    }, [sourceLanguage, targetLanguage, editors])

    useEffect(() => {
        if (!filesConfirmed || !trafficId || !files.length) { return }
        handleCalculatePrice()
    }, [filesConfirmed, trafficId, selectedTranslatorId, translatorTrafficId])

    const clientPricePerPage = useMemo(() => {
        const clientTariff = tariffs?.find((t) => String(t.id) === trafficId)
        const basePrice = clientTariff?.price_per_page ? parseFloat(clientTariff.price_per_page) : 0
        if (activeDiscount > 0 && basePrice > 0) {
            return basePrice * (1 - activeDiscount / 100)
        }
        return basePrice
    }, [trafficId, tariffs, activeDiscount])

    const enrichedTranslators = useMemo(() => {
        return translators.map(translator => {
            if (!translator.traffic || translator.traffic.length === 0) { return translator }
            const hasProfitable = translator.traffic.some((t: any) => {
                const tRate = t.rate_per_page ? parseFloat(t.rate_per_page) : Infinity
                return clientPricePerPage > 0 && tRate < clientPricePerPage
            })
            return {
                ...translator,
                full_name: hasProfitable ? `✅ ${translator.full_name} (Є вигідний тариф)` : translator.full_name,
            }
        })
    }, [translators, clientPricePerPage])

    const translatorTrafficOptions: { value: string; label: string; meta: TranslatorTrafficMeta }[] = useMemo(() => {
        const currentTranslator = translators.find(t => t.id === selectedTranslatorId)
        if (!currentTranslator?.traffic) { return [] }

        return currentTranslator.traffic.map((t: any) => {
            const tRate = t.rate_per_page ? parseFloat(t.rate_per_page) : 0
            const margin = clientPricePerPage - tRate
            const marginPercent = clientPricePerPage > 0 ? ((margin / clientPricePerPage) * 100).toFixed(1) : 0
            const isProfitable = clientPricePerPage > 0 && tRate < clientPricePerPage

            return {
                value: String(t.id),
                label: t.name || 'Особистий тариф',
                meta: {
                    rate_per_page: t.rate_per_page,
                    rate_per_action: t.rate_per_action,
                    currency: t.currency_sign || '',
                    isProfitable,
                    marginStr: clientPricePerPage > 0 ? `${margin.toFixed(2)} (${marginPercent}%)` : null,
                } satisfies TranslatorTrafficMeta,
            }
        })
    }, [selectedTranslatorId, translators, clientPricePerPage])

    const tariffOptions: { value: string; label: string; meta: TariffMeta }[] = useMemo(() => {
        return (tariffs ?? []).map((tariff: any) => ({
            value: String(tariff.id),
            label: tariff.name,
            meta: {
                category: tariff.category_name,
                price_per_page: tariff.price_per_page,
                price_per_action: tariff.price_per_action,
            } satisfies TariffMeta,
        }))
    }, [tariffs])

    // ─── Render ─────────────────────────────────────────────────────────────

    if (open && !isRestored && mode !== "edit") {
        return null
    }

    return (
        <>
            <WizardModal
                open={open}
                onOpenChange={onOpenChange}
                title={mode === "edit" ? t("orders.edit") : t("orders.createNew")}
                step={currentStep}
                onStepChange={setCurrentStep}
                steps={[
                    { title: t("orders.clientAndFiles") },
                    { title: t("orders.tariff") },
                    { title: t("orders.assignment") },
                    { title: t("common.deadline") },
                    { title: t("orders.statistics") },
                ]}
                isLoading={loading}
                onClose={handleModalClose}
                onSubmit={handleOrderSubmit}
                stepValidation={stepValidation}
                stepError={stepError}
            >
                {/* ── Крок 1: Client & Files ── */}
                <WizardStep>
                    <div className="space-y-6">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium">
                                <User className="h-4 w-4 text-blue-600" />
                                {t("common.client")} *
                            </label>
                            <Combobox
                                value={clientId}
                                onChange={setClientId}
                                placeholder={t("orders.selectClient")}
                                options={clients.map((c) => ({
                                    value: String(c.id),
                                    label: c.full_name,
                                }))}
                                renderSelected={(option) => {
                                    const c = clients.find((cl) => String(cl.id) === option.value)
                                    if (!c) { return option.label }
                                    return (
                                        <div className="flex items-center gap-2">
                                            <span>{c.full_name}</span>
                                            {c.category_name && (
                                                <span className="text-xs text-muted-foreground">
                                                    {t("orders.category")}: {c.category_name}{c.discount_percent ? ` · ${t("orders.discount")}: ${c.discount_percent}%` : ""}
                                                </span>
                                            )}
                                        </div>
                                    )
                                }}
                                renderOption={(option) => {
                                    const c = clients.find((cl) => String(cl.id) === option.value)
                                    return (
                                        <div className="flex flex-col">
                                            <span>{c?.full_name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {c?.category_name
                                                    ? `${t("orders.category")}: ${c.category_name}${c.discount_percent ? ` · ${t("orders.discount")}: ${c.discount_percent}%` : ""}`
                                                    : t("orders.noCategory")
                                                }
                                            </span>
                                        </div>
                                    )
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Combobox
                                value={sourceLanguage}
                                onChange={setSourceLanguage}
                                placeholder={t("common.sourceLanguage")}
                                options={languages.map((l) => ({ value: String(l.id), label: l.name }))}
                            />
                            <Combobox
                                value={targetLanguage}
                                onChange={setTargetLanguage}
                                placeholder={t("common.targetLanguage")}
                                options={languages.map((l) => ({ value: String(l.id), label: l.name }))}
                            />
                        </div>

                        <FileUpload
                            files={files}
                            onFilesChange={(f) => {
                                setFiles(f)
                                setFilesConfirmed(false)
                                setImagesAnalyzed(false)
                                setTotalAmount("")
                                setUseManualPrice(false)
                            }}
                        />

                        {!filesConfirmed && (
                            <button
                                type="button"
                                onClick={handleConfirmFiles}
                                disabled={!files.length || statsLoading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
                            >
                                {statsLoading ? t("orders.calculating") : t("orders.confirmFiles")}
                            </button>
                        )}

                        {filesConfirmed && statsResult && (
                            <div className="bg-gray-100 p-4 rounded-lg text-sm space-y-1">
                                <p>{t("common.pages")}: {statsResult.total_stats.physical_pages}</p>
                                <p>{t("common.withSpaces")}: {statsResult.total_stats.chars_with_spaces}</p>
                                <p>{t("orders.charsWithoutSpaces")}: {statsResult.total_stats.chars_no_spaces}</p>
                                <p>{t("common.images")}: {statsResult.total_stats.images}</p>
                                {statsResult.total_stats.images > 0 && (
                                    <div className="mt-3 flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <span className="text-yellow-500 mt-0.5">⚠️</span>
                                        <p className="text-yellow-700 text-xs leading-relaxed">
                                            {t("orders.documentImagesWarning", { count: statsResult.total_stats.images })}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {analysisResult && (
                            <div className="bg-purple-50 p-4 rounded-lg text-sm">
                                <p className="text-purple-700 font-medium">{t("orders.ocrCompleted")}</p>
                                <p>{t("orders.ocrTotalImages")}: {analysisResult.total_images_found}</p>
                                <p>{t("orders.ocrTotalSymbols")}: {analysisResult.total_detected_symbols_from_images}</p>
                                <div className="mt-3 space-y-2">
                                    {analysisResult.results?.map((r: any, idx: number) => (
                                        <div key={idx} className="p-2 bg-white rounded border">
                                            <div className="font-medium">{r.filename} ({r.file_type})</div>
                                            {r.error ? (
                                                <div className="text-red-600">{r.error}</div>
                                            ) : (
                                                <>
                                                    <div>{t("common.images")}: {r.images_found}</div>
                                                    <div>{t("orders.symbols")}: {r.detected_symbols_from_images}</div>
                                                    {r.preview_text && <div className="text-gray-600">{r.preview_text}</div>}
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {imagesAnalyzed && !analysisLoading && (
                            <div className="text-green-600 text-sm font-medium">✅ {t("orders.imagesAnalysisCompleted")}</div>
                        )}
                    </div>
                </WizardStep>

                {/* ── Крок 2: Tariff ── */}
                <WizardStep>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Tag className="h-4 w-4 text-blue-600" />
                                {t("orders.tariff")} <span className="text-red-500">*</span>
                            </label>
                            <Combobox<TariffMeta>
                                value={trafficId}
                                onChange={setTrafficId}
                                placeholder={t("orders.selectTariff")}
                                searchPlaceholder={t("orders.searchTariff")}
                                options={tariffOptions}
                                renderOption={(option) => (
                                    <div className="flex flex-col w-full py-1 gap-1.5">
                                        <div className="flex items-start justify-between w-full">
                                            <span className="font-medium text-foreground">{option.label}</span>
                                            {option.meta?.category && (
                                                <span className="px-2 py-0.5 rounded-md bg-blue-100/80 text-blue-700 text-[10px] font-semibold tracking-wide uppercase shrink-0">
                                                    {option.meta.category}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            {option.meta?.price_per_page != null && (
                                                <span className="flex items-center gap-1">
                                                    {t("orders.page")}: <span className="font-semibold text-gray-700">{option.meta.price_per_page}</span>
                                                </span>
                                            )}
                                            {option.meta?.price_per_page != null && option.meta?.price_per_action != null && (
                                                <span className="w-1 h-1 rounded-full bg-border" />
                                            )}
                                            {option.meta?.price_per_action != null && (
                                                <span className="flex items-center gap-1">
                                                    {t("orders.action")}: <span className="font-semibold text-gray-700">{option.meta.price_per_action}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                renderSelected={(option) => (
                                    <div className="flex w-full items-center justify-between pr-4 gap-2">
                                        <span className="truncate font-medium text-foreground">{option.label}</span>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {option.meta?.category && (
                                                <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium text-muted-foreground">
                                                    {option.meta.category}
                                                </span>
                                            )}
                                            {(option.meta?.price_per_page != null || option.meta?.price_per_action != null) && (
                                                <span className="text-[11px] text-green-700 font-semibold bg-green-100/50 px-2 py-0.5 rounded-md border border-green-200/50">
                                                    {option.meta?.price_per_page ?? 0} / {t("orders.perPageShort")}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <DollarSign className="h-4 w-4 text-blue-600" />
                                {t("orders.currency")}
                            </label>
                            <Combobox
                                value={currencyId}
                                onChange={setCurrencyId}
                                placeholder={t("orders.selectCurrency")}
                                searchPlaceholder={t("orders.searchCurrency")}
                                options={currencies.map((currency) => ({
                                    value: String(currency.id),
                                    label: `${currency.code} - ${currency.name}`,
                                }))}
                            />
                        </div>
                    </div>
                </WizardStep>

                {/* ── Крок 3: Assignment ── */}
                <WizardStep>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <Users className="h-4 w-4 text-blue-600" />
                                    Translator
                                </label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-blue-600 hover:bg-blue-50"
                                    onClick={openAddTranslator}
                                >
                                    <UserPlus className="h-3.5 w-3.5 mr-1" />
                                    {t("orders.quickCreate")}
                                </Button>
                            </div>
                            <TranslatorSelect
                                value={selectedTranslatorId}
                                translators={enrichedTranslators}
                                sourceLanguage={sourceLanguage}
                                targetLanguage={targetLanguage}
                                placeholder={t("orders.selectTranslatorOptional")}
                                orderTrafficId={trafficId ? Number(trafficId) : null}
                                onChange={(translatorId) => {
                                    setSelectedTranslatorId(translatorId)
                                    if (!translatorId) {
                                        setTranslatorTrafficId("")
                                        return
                                    }
                                    const selectedTranslator = translators.find(t => t.id === translatorId)
                                    if (selectedTranslator?.traffic && selectedTranslator.traffic.length > 0) {
                                        const bestTariff = [...selectedTranslator.traffic].sort((a, b) => {
                                            const rateA = a.rate_per_page ? parseFloat(a.rate_per_page) : Infinity
                                            const rateB = b.rate_per_page ? parseFloat(b.rate_per_page) : Infinity
                                            return rateA - rateB
                                        })[0]
                                        setTranslatorTrafficId(String(bestTariff.id))
                                    } else {
                                        setTranslatorTrafficId("")
                                    }
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Users className="h-4 w-4 text-green-600" />
                                Editor
                            </label>
                            <Combobox
                                value={editor}
                                onChange={setEditor}
                                placeholder={t("orders.selectEditorOptional")}
                                options={editorOptions}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <User className="h-4 w-4 text-indigo-600" />
                                Менеджер на прийом
                            </label>
                            <Combobox
                                value={managerAccept}
                                onChange={setManagerAccept}
                                placeholder={t("orders.selectManager")}
                                options={managers.map((m) => ({ value: String(m.id), label: m.full_name }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <User className="h-4 w-4 text-purple-600" />
                                Менеджер на здачу
                            </label>
                            <Combobox
                                value={managerDelivery}
                                onChange={setManagerDelivery}
                                placeholder={t("orders.selectManager")}
                                options={managers.map((m) => ({ value: String(m.id), label: m.full_name }))}
                            />
                        </div>

                        {selectedTranslatorId && (
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <Tag className="h-4 w-4 text-orange-500" />
                                    Translator Traffic
                                </label>
                                <Combobox<TranslatorTrafficMeta>
                                    value={translatorTrafficId}
                                    onChange={setTranslatorTrafficId}
                                    placeholder={t("orders.selectTraffic")}
                                    options={translatorTrafficOptions}
                                    renderOption={(option) => (
                                        <div className="flex flex-col w-full py-1 gap-1.5">
                                            <div className="flex items-start justify-between w-full">
                                                <span className="font-medium text-foreground">{option.label}</span>
                                                {option.meta?.marginStr && (
                                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${option.meta.isProfitable ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                                        {t("orders.margin")} {option.meta.marginStr}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                {option.meta?.rate_per_page != null && (
                                                    <span className="flex items-center gap-1">
                                                        {t("orders.page")}: <span className="font-semibold text-gray-700">{option.meta.rate_per_page} {option.meta.currency}</span>
                                                    </span>
                                                )}
                                                {option.meta?.rate_per_page != null && option.meta?.rate_per_action != null && (
                                                    <span className="w-1 h-1 rounded-full bg-border" />
                                                )}
                                                {option.meta?.rate_per_action != null && (
                                                    <span className="flex items-center gap-1">
                                                        {t("orders.action")}: <span className="font-semibold text-gray-700">{option.meta.rate_per_action} {option.meta.currency}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    renderSelected={(option) => (
                                        <div className="flex w-full items-center justify-between pr-4 gap-2">
                                            <span className="truncate font-medium text-foreground">{option.label}</span>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {(option.meta?.rate_per_page != null || option.meta?.rate_per_action != null) && (
                                                    <span className="text-[11px] text-orange-700 font-semibold bg-orange-100/50 px-2 py-0.5 rounded-md border border-orange-200/50">
                                                        {option.meta?.rate_per_page ?? option.meta?.rate_per_action ?? 0} {option.meta?.currency}
                                                    </span>
                                                )}
                                                {option.meta?.marginStr && (
                                                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${option.meta.isProfitable ? 'bg-green-100/50 text-green-700 border-green-200/50' : 'bg-red-100/50 text-red-700 border-red-200/50'}`}>
                                                        {t("orders.margin")} {option.meta.marginStr}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                />
                                {translatorTrafficOptions.length === 0 && (
                                    <p className="text-xs text-red-500">У цього перекладача немає тарифу!</p>
                                )}
                            </div>
                        )}
                    </div>
                </WizardStep>

                {/* ── Крок 4: Deadline ── */}
                <WizardStep>
                    <div className="space-y-6">
                        <PrioritySelector value={priority} onChange={setPriority} required />

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <CalendarClock className="h-4 w-4 text-blue-600" />
                                {t("common.deadline")} <span className="text-red-500">*</span>
                            </label>
                            <DeadlineSelector value={deadline} onChange={setDeadline} minDate={new Date()} />
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <MessageSquare className="h-4 w-4 text-blue-600" />
                                {t("orders.comment")}
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder={t("orders.additionalNotes")}
                                className="w-full px-3 py-2 border rounded-md min-h-[120px] resize-y"
                            />
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium mb-2">{t("orders.summary")}</h4>
                            <div className="space-y-1 text-sm text-gray-600">
                                <p>• {t("common.client")}: {clients.find((c) => String(c.id) === clientId)?.full_name || t("orders.notSelected")}</p>
                                <p>• {t("orders.files")}: {t("orders.fileCount", { count: files.length })}</p>
                                <p>
                                    • {t("orders.summaryLanguages")}: {languages.find((l) => String(l.id) === sourceLanguage)?.name || "?"} →{" "}
                                    {languages.find((l) => String(l.id) === targetLanguage)?.name || "?"}
                                </p>
                                <p>• {t("orders.tariff")}: {tariffs?.find((t) => String(t.id) === trafficId)?.name || t("orders.notSelected")}</p>
                                <p>• {t("common.priority")}: {priority || t("orders.none")}</p>
                                <p>• {t("common.deadline")}: {deadline?.toLocaleDateString() || t("common.notSet")}</p>
                            </div>
                        </div>
                    </div>
                </WizardStep>

                {/* ── Крок 5: Statistics & Price ── */}
                <WizardStep>
                    {(() => {
                        const selectedCurrencyObj = currencies.find((c) => String(c.id) === currencyId)
                        const orderCurrency = selectedCurrencyObj ? selectedCurrencyObj.code : ""

                        let realMargin = priceData?.margin
                        let isMarginNegative = false

                        if (priceData?.translator_total && effectivePrice !== "-") {
                            const currentClientPrice = parseFloat(String(effectivePrice))
                            const translatorCost = parseFloat(priceData.translator_total)
                            if (!isNaN(currentClientPrice) && !isNaN(translatorCost)) {
                                const marginValue = currentClientPrice - translatorCost
                                realMargin = marginValue.toFixed(2)
                                isMarginNegative = marginValue < 0
                            }
                        } else if (priceData?.margin) {
                            isMarginNegative = parseFloat(priceData.margin) < 0
                        }

                        return (
                            <div className="space-y-6">
                                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <BarChart2 className="h-4 w-4 text-blue-600" />
                                    {t("orders.fileStatistics")}
                                </h3>

                                {statsResult ? (
                                    <>
                                        <div className="rounded-xl border divide-y text-sm">
                                            <div className="flex justify-between px-4 py-3">
                                                <span className="text-gray-500">{t("orders.autoPages")}</span>
                                                <span className="font-medium">{statsResult.total_stats.physical_pages}</span>
                                            </div>
                                            <div className="flex justify-between px-4 py-3">
                                                <span className="text-gray-500">{t("common.withSpaces")}</span>
                                                <span className="font-medium">{statsResult.total_stats.chars_with_spaces}</span>
                                            </div>
                                            <div className="flex justify-between px-4 py-3">
                                                <span className="text-gray-500">{t("common.withoutSpaces")}</span>
                                                <span className="font-medium">{statsResult.total_stats.chars_no_spaces}</span>
                                            </div>
                                            <div className="flex justify-between px-4 py-3">
                                                <span className="text-gray-500">{t("common.images")}</span>
                                                <span className="font-medium">{statsResult.total_stats.images}</span>
                                            </div>
                                        </div>

                                        {statsResult.total_stats.images > 0 && (
                                            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                                                <span className="text-yellow-500 mt-0.5">⚠️</span>
                                                <p className="text-yellow-700 text-xs leading-relaxed">
                                                    Документ містить <strong>{statsResult.total_stats.images}</strong> зображень.
                                                    Текст у зображеннях не враховується автоматично — підрахунок може бути некоректним.
                                                </p>
                                            </div>
                                        )}

                                        <div className="rounded-xl border p-4 space-y-3">
                                            <label className="text-sm font-medium text-gray-700 block">
                                                {t("orders.orderDiscount")}
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={customDiscount}
                                                    onChange={(e) => {
                                                        setCustomDiscount(e.target.value)
                                                        setUseManualPrice(false)
                                                    }}
                                                    placeholder={t("orders.standardDiscount", { value: defaultDiscountPercent })}
                                                    className="w-32 px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <span className="text-xs text-gray-500">
                                                    {t("orders.leaveEmptyForStandardDiscount", { value: defaultDiscountPercent })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border p-4 space-y-3">
                                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={useManualPrice}
                                                    onChange={(e) => {
                                                        setUseManualPrice(e.target.checked)
                                                        if (!e.target.checked) { setTotalAmount(String(discountedAutoPrice)) }
                                                    }}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                                                />
                                                <span className="text-sm font-medium text-gray-700">
                                                    {t("orders.manualPrice")}
                                                </span>
                                            </label>

                                            {useManualPrice && (
                                                <div className="flex items-center gap-3 pl-7">
                                                    <span className="text-sm text-gray-500">{t("orders.clientPrice")}</span>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={totalAmount}
                                                            onChange={(e) => setTotalAmount(e.target.value)}
                                                            placeholder={priceData?.total_client_price ?? "0.00"}
                                                            className="w-32 px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                                        />
                                                        <span className="text-sm font-medium text-gray-600">{orderCurrency}</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="pl-7 text-sm text-gray-500">
                                                {t("orders.finalPrice")}:{" "}
                                                <span className="font-semibold text-gray-800">{effectivePrice} {orderCurrency}</span>
                                            </div>
                                        </div>

                                        {priceLoading && (
                                            <div className="text-sm text-gray-400 text-center py-2">
                                                {t("orders.calculatingPrice")}
                                            </div>
                                        )}

                                        {priceData && !priceLoading && (
                                            <div className="rounded-xl border p-4 space-y-2 bg-green-50 text-sm">
                                                <p className="font-semibold text-green-700">{t("orders.priceCalculation")}</p>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">{t("orders.autoPages")}:</span>
                                                    <span className="font-medium">{priceData.pages}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">{t("orders.autoBasePrice")}</span>
                                                    <span className="font-medium">{priceData.total_client_price} {orderCurrency}</span>
                                                </div>
                                                {activeDiscount > 0 && (
                                                    <div className="flex justify-between text-blue-600 mt-1">
                                                        <span className="font-medium">
                                                            {t("orders.discount")} ({customDiscount !== "" ? t("orders.manualDiscount") : t("orders.clientDiscount")} {activeDiscount}%):
                                                        </span>
                                                        <span className="font-bold">
                                                            -{(baseAutoPrice * (activeDiscount / 100)).toFixed(2)} {orderCurrency}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between border-t border-green-200 pt-2 mt-2">
                                                    <span className="text-gray-800 font-semibold">{t("orders.amountDue")}</span>
                                                    <span className="font-bold text-green-700">{discountedAutoPrice} {orderCurrency}</span>
                                                </div>
                                                {priceData.translator_rate_per_page && (
                                                    <>
                                                        <div className="flex justify-between mt-4">
                                                            <span className="text-gray-600">{t("orders.translatorCost")}</span>
                                                            <span className="font-medium">{priceData.translator_total} {orderCurrency}</span>
                                                        </div>
                                                        <div className="flex justify-between border-t border-green-200 pt-2 mt-1">
                                                            <span className="text-gray-600">{t("orders.margin")}</span>
                                                            <span className={`font-semibold ${isMarginNegative ? 'text-red-600' : 'text-green-700'}`}>
                                                                {realMargin} {orderCurrency}
                                                            </span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-sm text-gray-400 text-center py-8">
                                        {t("orders.statisticsUnavailable")}
                                    </div>
                                )}
                            </div>
                        )
                    })()}
                </WizardStep>
            </WizardModal>

            <BaseFormModal
                open={isFormOpen}
                onOpenChange={(open) => !open && closeModals()}
                title={t("orders.createTranslator")}
                submitLabel={t("common.save")}
                onSubmit={handleQuickCreateTranslator}
            >
                <div className="space-y-4 pt-2">
                    <Input
                        placeholder={t("orders.fullName")}
                        value={form.full_name}
                        onChange={(e) => setForm(prev => ({ ...prev, full_name: e.target.value }))}
                    />
                    <Input
                        placeholder={t("auth.email")}
                        value={form.email}
                        onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                    <PatternFormat
                        format="+38 (###) ###-##-##"
                        allowEmptyFormatting
                        mask="_"
                        value={form.phone}
                        customInput={Input}
                        type="tel"
                        onValueChange={(values) => {
                            setForm(prev => ({ ...prev, phone: values.formattedValue }))
                        }}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            type="number"
                            min="0"
                            placeholder={t("orders.currencyId")}
                            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            onKeyDown={(e) => {
                                if (["-", "e", "E", "+"].includes(e.key)) { e.preventDefault() }
                            }}
                            onFocus={(e) => e.target.select()}
                            value={form.currency_id === 0 ? "" : form.currency_id}
                            onChange={(e) => {
                                const val = e.target.value
                                const numericValue = val === "" ? 0 : Math.max(0, parseInt(val, 10))
                                setForm(prev => ({ ...prev, currency_id: numericValue }))
                            }}
                        />
                    </div>
                </div>
            </BaseFormModal>
        </>
    )
}