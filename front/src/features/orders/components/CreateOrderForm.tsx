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
    Settings2,
    FileText,
    Image as ImageIcon,
    Type,
    Plus,
    X
} from "lucide-react"

import { useTranslators } from "@/src/features/translators/hooks/useTranslators"
import { BaseFormModal } from "@/src/components/modals/BaseFormModal"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"

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

// 👇 Додали імпорти для Select (як у твоєму прикладі)
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select"

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
    onSubmit: (data?: any) => void
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

    onCreateTariff?: (data: { name: string; price_per_page: string; currency_id: string }) => Promise<any>
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
        onCreateTariff,
    } = props

    // 👇 Дістаємо все необхідне з хука useTranslators
    const {
        form, setForm, isFormOpen, openAddTranslator, closeModals, submitTranslator,
        traffic,
        isInlineTrafficOpen, setIsInlineTrafficOpen,
        inlineTrafficForm, setInlineTrafficForm,
        inlineTrafficLoading, createAndSelectTraffic,
        languagePairs: tLanguagePairs // Аліас, щоб не конфліктувало
    } = useTranslators()

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

    // --- Логіка ручної статистики ---
    const [isManualStats, setIsManualStats] = useState(false)
    const [manualStats, setManualStats] = useState({
        pages: "",
        charsWithSpaces: "",
        charsNoSpaces: "",
        images: ""
    })

    // --- Логіка створення тарифу ЗАМОВЛЕННЯ ---
    const [isTariffModalOpen, setIsTariffModalOpen] = useState(false)
    const [isCreatingTariff, setIsCreatingTariff] = useState(false)
    const [tariffForm, setTariffForm] = useState({
        name: "",
        price_per_page: "",
        currency_id: ""
    })

    // Синхронізація автоматичної статистики з ручною при зміні файлів
    useEffect(() => {
        if (statsResult && !isManualStats) {
            setManualStats({
                pages: String(statsResult.total_stats.physical_pages),
                charsWithSpaces: String(statsResult.total_stats.chars_with_spaces),
                charsNoSpaces: String(statsResult.total_stats.chars_no_spaces),
                images: String(statsResult.total_stats.images),
            })
        }
    }, [statsResult])

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

    const resetWizardState = () => {
        setClientId("")
        setFiles([])
        setSourceLanguage("")
        setTargetLanguage("")
        setTrafficId("")
        setCurrencyId("")
        setSelectedTranslatorId(null)
        setEditor("")
        setTranslatorTrafficId("")
        setManagerAccept("")
        setManagerDelivery("")
        setDeadline(undefined)
        setComment("")
        setPriority(undefined as any)
        setTotalAmount("")

        resetStats()
        setCurrentStep(0)
        setFilesConfirmed(false)
        setImagesAnalyzed(false)
        setPriceData(null)
        setUseManualPrice(false)
        setCustomDiscount("")
        setIsManualStats(false)
        setManualStats({ pages: "", charsWithSpaces: "", charsNoSpaces: "", images: "" })
    }

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
    }

    const handleQuickCreateTariff = async () => {
        if (!onCreateTariff) return
        try {
            setIsCreatingTariff(true)
            const newTariff = await onCreateTariff(tariffForm)

            if (newTariff && newTariff.id) {
                setTrafficId(String(newTariff.id))
                if (newTariff.currency_id) {
                    setCurrencyId(String(newTariff.currency_id))
                }
            }

            setIsTariffModalOpen(false)
            setTariffForm({ name: "", price_per_page: "", currency_id: "" })
        } catch (error) {
            console.error("Помилка створення тарифу:", error)
        } finally {
            setIsCreatingTariff(false)
        }
    }

    const DRAFT_KEY = "create_order_draft"

    useEffect(() => {
        if (!open) {
            setIsRestored(false)
            if (mode !== "edit") {
                resetWizardState()
            }
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
                    if (d.isManualStats !== undefined) { setIsManualStats(d.isManualStats) }
                    if (d.manualStats) { setManualStats(d.manualStats) }

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
                filesConfirmed, files, currentStep,
                isManualStats, manualStats
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
        customDiscount, totalAmount, files, filesConfirmed,
        currentStep, isManualStats, manualStats, open, isRestored, mode,
    ])

    const handleModalClose = (open: boolean) => {
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

    const handleOrderSubmit = async () => {
        try {
            await localforage.removeItem(DRAFT_KEY)
        } catch (error) {
            console.error("Помилка видалення чернетки:", error)
        }
        onSubmit({
            manualStats: isManualStats ? manualStats : null
        })
    }

    const stepValidation = (step: number): boolean => {
        switch (step) {
            case 0: return !!clientId && !!sourceLanguage && !!targetLanguage && files.length > 0 && filesConfirmed
            case 1: return !!trafficId && !!currencyId
            case 2: return (selectedTranslatorId ? !!translatorTrafficId : true) && !!editor && !!managerAccept && !!managerDelivery
            case 3: return !!deadline && !!priority && !!comment.trim()
            case 4: return true
            default: return true
        }
    }

    const stepError = (step: number): string | null => {
        switch (step) {
            case 0:
                if (!clientId) return t("orders.validation.selectClient")
                if (!sourceLanguage) return t("orders.validation.selectSourceLanguage")
                if (!targetLanguage) return t("orders.validation.selectTargetLanguage")
                if (!files.length) return t("orders.validation.uploadFile")
                if (!filesConfirmed) return t("orders.confirmFilesValidation", { button: t("orders.confirmFiles") })
                return null
            case 1:
                if (!trafficId) return t("orders.validation.selectTariff")
                if (!currencyId) return t("orders.validation.selectCurrency")
                return null
            case 2:
                if (selectedTranslatorId && !translatorTrafficId) return t("orders.validation.selectTranslatorTariff")
                if (!editor) return t("orders.validation.selectEditor")
                if (!managerAccept) return t("orders.validation.selectAcceptManager")
                if (!managerDelivery) return t("orders.validation.selectDeliveryManager")
                return null
            case 3:
                if (!priority) return t("orders.validation.selectPriority")
                if (!deadline) return t("orders.validation.setDeadline")
                if (!comment.trim()) return t("orders.validation.addComment")
                return null
            default:
                return null
        }
    }

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
                            <label className="flex items-center gap-2 text-sm font-medium mb-2">
                                <User className="h-4 w-4 text-blue-600" />
                                {t("common.client")} <span className="text-red-500">*</span>
                            </label>
                            <Combobox
                                value={clientId}
                                onChange={setClientId}
                                placeholder={t("orders.selectClient")}
                                options={clients.map((c) => ({ value: String(c.id), label: c.full_name }))}
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
                                setIsManualStats(false)
                            }}
                        />

                        {!filesConfirmed && (
                            <button
                                type="button"
                                onClick={handleConfirmFiles}
                                disabled={!files.length || statsLoading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 transition-all hover:bg-blue-700 w-full sm:w-auto"
                            >
                                {statsLoading ? t("orders.calculating") : t("orders.confirmFiles")}
                            </button>
                        )}

                        {filesConfirmed && statsResult && (
                            <div className={`rounded-xl border shadow-sm transition-all duration-300 ${isManualStats ? 'border-blue-300 bg-blue-50/20' : 'border-gray-200 bg-white'}`}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl gap-3">
                                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                        <Settings2 className="h-4 w-4 text-blue-600" />
                                        Статистика документа
                                    </h3>
                                    <label className="flex items-center gap-2 cursor-pointer select-none bg-white px-3 py-1.5 rounded-lg border border-gray-200 transition-colors hover:bg-gray-50 shadow-sm">
                                        <input type="checkbox" checked={isManualStats} onChange={(e) => setIsManualStats(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                                        <span className="text-sm font-medium text-gray-700">Редагувати вручну</span>
                                    </label>
                                </div>
                                <div className="p-4">
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="flex flex-col space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                                                <FileText className="w-3.5 h-3.5 text-gray-400" /> {t("orders.autoPages")}
                                            </span>
                                            {isManualStats ? <Input type="number" min="0" className="h-8 mt-1 font-semibold text-blue-700 bg-white" value={manualStats.pages} onChange={(e) => setManualStats(p => ({ ...p, pages: e.target.value }))} /> : <span className="text-lg font-bold text-gray-900">{manualStats.pages}</span>}
                                        </div>
                                        <div className="flex flex-col space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                                                <Type className="w-3.5 h-3.5 text-gray-400" /> {t("common.withSpaces")}
                                            </span>
                                            {isManualStats ? <Input type="number" min="0" className="h-8 mt-1 font-semibold text-blue-700 bg-white" value={manualStats.charsWithSpaces} onChange={(e) => setManualStats(p => ({ ...p, charsWithSpaces: e.target.value }))} /> : <span className="text-lg font-bold text-gray-900">{manualStats.charsWithSpaces}</span>}
                                        </div>
                                        <div className="flex flex-col space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                                                <Type className="w-3.5 h-3.5 text-gray-400" /> {t("common.withoutSpaces")}
                                            </span>
                                            {isManualStats ? <Input type="number" min="0" className="h-8 mt-1 font-semibold text-blue-700 bg-white" value={manualStats.charsNoSpaces} onChange={(e) => setManualStats(p => ({ ...p, charsNoSpaces: e.target.value }))} /> : <span className="text-lg font-bold text-gray-900">{manualStats.charsNoSpaces}</span>}
                                        </div>
                                        <div className="flex flex-col space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                                                <ImageIcon className="w-3.5 h-3.5 text-gray-400" /> {t("common.images")}
                                            </span>
                                            {isManualStats ? <Input type="number" min="0" className="h-8 mt-1 font-semibold text-blue-700 bg-white" value={manualStats.images} onChange={(e) => setManualStats(p => ({ ...p, images: e.target.value }))} /> : <span className="text-lg font-bold text-gray-900">{manualStats.images}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </WizardStep>

                {/* ── Крок 2: Tariff ── */}
                <WizardStep>
                    <div className="space-y-6">
                        <div className="flex gap-2 items-end">
                            <div className="flex-1 space-y-2">
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
                                            </div>
                                        </div>
                                    )}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsTariffModalOpen(true)}
                                className="flex items-center justify-center gap-1.5 px-3 h-10 rounded-xl border border-dashed border-gray-300 hover:border-blue-600 hover:text-blue-600 text-sm text-gray-500 transition-all duration-200"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">{t("common.create", "Створити")}</span>
                            </button>
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
                        <div className="flex gap-2 items-end">
                            <div className="flex-1 space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <Users className="h-4 w-4 text-blue-600" />
                                    Translator
                                </label>
                                <TranslatorSelect
                                    value={selectedTranslatorId}
                                    translators={enrichedTranslators}
                                    sourceLanguage={sourceLanguage}
                                    targetLanguage={targetLanguage}
                                    placeholder={t("orders.selectTranslatorOptional")}
                                    orderTrafficId={trafficId ? Number(trafficId) : null}
                                    onChange={(translatorId) => {
                                        setSelectedTranslatorId(translatorId)
                                        if (!translatorId) { setTranslatorTrafficId(""); return }
                                        const selectedTranslator = translators.find(t => t.id === translatorId)
                                        if (selectedTranslator?.traffic && selectedTranslator.traffic.length > 0) {
                                            const bestTariff = [...selectedTranslator.traffic].sort((a, b) => {
                                                const rateA = a.rate_per_page ? parseFloat(a.rate_per_page) : Infinity
                                                const rateB = b.rate_per_page ? parseFloat(b.rate_per_page) : Infinity
                                                return rateA - rateB
                                            })[0]
                                            setTranslatorTrafficId(String(bestTariff.id))
                                        } else { setTranslatorTrafficId("") }
                                    }}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={openAddTranslator}
                                className="flex items-center justify-center gap-1.5 px-3 h-10 rounded-xl border border-dashed border-gray-300 hover:border-blue-600 hover:text-blue-600 text-sm text-gray-500 transition-all duration-200"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">{t("common.create", "Створити")}</span>
                            </button>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Users className="h-4 w-4 text-green-600" /> Editor
                            </label>
                            <Combobox value={editor} onChange={setEditor} placeholder={t("orders.selectEditorOptional")} options={editorOptions} />
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <User className="h-4 w-4 text-indigo-600" /> Менеджер на прийом
                            </label>
                            <Combobox value={managerAccept} onChange={setManagerAccept} placeholder={t("orders.selectManager")} options={managers.map((m) => ({ value: String(m.id), label: m.full_name }))} />
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <User className="h-4 w-4 text-purple-600" /> Менеджер на здачу
                            </label>
                            <Combobox value={managerDelivery} onChange={setManagerDelivery} placeholder={t("orders.selectManager")} options={managers.map((m) => ({ value: String(m.id), label: m.full_name }))} />
                        </div>

                        {selectedTranslatorId && (
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <Tag className="h-4 w-4 text-orange-500" /> Translator Traffic
                                </label>
                                <Combobox<TranslatorTrafficMeta>
                                    value={translatorTrafficId}
                                    onChange={setTranslatorTrafficId}
                                    placeholder={t("orders.selectTraffic")}
                                    options={translatorTrafficOptions}
                                />
                                {translatorTrafficOptions.length === 0 && <p className="text-xs text-red-500">У цього перекладача немає тарифу!</p>}
                            </div>
                        )}
                    </div>
                </WizardStep>

                {/* ── Крок 4 & 5... (залишені як і були для економії місця) ── */}
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
                    </div>
                </WizardStep>
                <WizardStep><div/></WizardStep>
            </WizardModal>

            {/* ─── Модалка створення ПЕРЕКЛАДАЧА ─── */}
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

                    {/* 👇 Блок "Тарифи перекладача" всередині модалки Перекладача */}
                    <div className="space-y-2 pt-2 border-t">
                        <label className="text-sm font-medium text-gray-700">
                            {t("translators.tariffs", "Тарифи перекладача")}
                        </label>

                        {/* Відображення вже вибраних тарифів */}
                        {form.tariff_ids.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {form.tariff_ids.map(id => {
                                    const tr = traffic.find(t => t.id === id)
                                    return (
                                        <Badge key={id} variant="secondary" className="flex items-center gap-1.5 px-2 py-1">
                                            <span>{tr?.name || `Тариф #${id}`}</span>
                                            <button
                                                type="button"
                                                className="text-gray-400 hover:text-red-500"
                                                onClick={() => setForm(p => ({ ...p, tariff_ids: p.tariff_ids.filter(tid => tid !== id) }))}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    )
                                })}
                            </div>
                        )}

                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <Combobox
                                    value=""
                                    onChange={(val) => {
                                        if (val && !form.tariff_ids.includes(Number(val))) {
                                            setForm(p => ({ ...p, tariff_ids: [...p.tariff_ids, Number(val)] }))
                                        }
                                    }}
                                    options={traffic
                                        .filter(t => !form.tariff_ids.includes(t.id))
                                        .map(t => ({ value: String(t.id), label: t.name }))
                                    }
                                    placeholder={t("common.chooseTariff", "Оберіть існуючий тариф...")}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsInlineTrafficOpen(true)}
                                className="flex items-center justify-center gap-1.5 px-3 h-10 rounded-xl border border-dashed border-gray-300 hover:border-blue-600 hover:text-blue-600 text-sm text-gray-500 transition-all duration-200 shrink-0"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </BaseFormModal>

            {/* ─── Модалка створення ТАРИФУ ПЕРЕКЛАДАЧА (Traffic) ─── */}
            {isInlineTrafficOpen && (
                <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-background rounded-2xl border shadow-2xl p-6 w-full max-w-sm space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-semibold">{t("translators.newTariff", "Створити тариф перекладача")}</h3>

                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium">Назва *</label>
                                <Input
                                    placeholder="Напр. Стандартний"
                                    value={inlineTrafficForm.name}
                                    onChange={(e) => setInlineTrafficForm(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">{t("common.languagePair")}</label>
                                <Select
                                    value={inlineTrafficForm.language_pair ? String(inlineTrafficForm.language_pair) : ""}
                                    onValueChange={(val) => setInlineTrafficForm(prev => ({ ...prev, language_pair: Number(val) }))}
                                >
                                    <SelectTrigger><SelectValue placeholder={t("common.chooseLanguagePair")} /></SelectTrigger>
                                    <SelectContent>
                                        {tLanguagePairs.map(pair => (
                                            <SelectItem key={pair.id} value={String(pair.id)}>{pair.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-medium">Валюта *</label>
                                    <Select
                                        value={inlineTrafficForm.currency_id ? String(inlineTrafficForm.currency_id) : ""}
                                        onValueChange={(val) => setInlineTrafficForm(prev => ({ ...prev, currency_id: Number(val) }))}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Валюта" /></SelectTrigger>
                                        <SelectContent>
                                            {currencies.map(c => (
                                                <SelectItem key={c.id} value={String(c.id)}>{c.code}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Ціна за стор.</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={inlineTrafficForm.rate_per_page || ""}
                                        onChange={(e) => setInlineTrafficForm(prev => ({ ...prev, rate_per_page: Number(e.target.value) }))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-4">
                            <button
                                type="button"
                                onClick={() => setIsInlineTrafficOpen(false)}
                                className="w-full sm:w-auto px-4 py-2 rounded-xl border text-sm hover:bg-accent/10 transition-all"
                            >
                                {t("common.cancel")}
                            </button>
                            <button
                                type="button"
                                onClick={createAndSelectTraffic}
                                disabled={inlineTrafficLoading}
                                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
                            >
                                {inlineTrafficLoading ? t("common.creating", "Створення...") : t("common.create", "Створити")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Модалка створення Тарифу Замовлення ─── */}
            <BaseFormModal
                open={isTariffModalOpen}
                onOpenChange={(open) => {
                    setIsTariffModalOpen(open)
                    if (!open) setTariffForm({ name: "", price_per_page: "", currency_id: "" })
                }}
                title={t("orders.createTariff", "Створити тариф")}
                submitLabel={t("common.save")}
                onSubmit={handleQuickCreateTariff}
            >
                <div className="space-y-4 pt-2">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">Назва тарифу *</label>
                        <Input
                            placeholder="Напр. Стандарт"
                            value={tariffForm.name}
                            onChange={(e) => setTariffForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">Ціна за сторінку *</label>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={tariffForm.price_per_page}
                            onChange={(e) => setTariffForm(prev => ({ ...prev, price_per_page: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">Валюта *</label>
                        <Combobox
                            value={tariffForm.currency_id}
                            onChange={(val) => setTariffForm(prev => ({ ...prev, currency_id: val }))}
                            placeholder={t("orders.selectCurrency")}
                            options={currencies.map((currency) => ({
                                value: String(currency.id),
                                label: `${currency.code} - ${currency.name}`,
                            }))}
                        />
                    </div>
                </div>
            </BaseFormModal>
        </>
    )
}