"use client"

import { useState, useEffect, useMemo } from "react"
import type { ReactNode } from "react"
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
    UserPlus,
    X,
    Loader2,
    Zap
} from "lucide-react"

import { useTranslators } from "@/src/features/translators/hooks/useTranslators"
import { BaseFormModal } from "@/src/components/modals/BaseFormModal"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"

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

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select"

// ─── Допоміжні компоненти та стилі для модалок ──────────────────────────────

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

// ─── Утиліта визначення "тариф лише за дію" ─────────────────────────────────
function isActionOnlyRate(
    pricePerPage: number | string | null | undefined,
    pricePerAction: number | string | null | undefined
): boolean {
    const hasPage = pricePerPage != null && Number(pricePerPage) > 0
    const hasAction = pricePerAction != null && Number(pricePerAction) > 0
    return hasAction && !hasPage
}

function pluralFilesUk(n: number): string {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return "файл"
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "файли"
    return "файлів"
}

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

interface PriceSummary {
    mode: "page" | "action"
    pages?: number
    filesCount?: number
    rate?: number
    clientTotal: number
    translatorTotal: number | null
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

    sourceFiles?: { id: number; name: string }[]
    onDownloadFile?: (fileId: number, filename: string) => void
    onDeleteFile?: (fileId: number) => void
    deleteFileLoadingId?: number | null
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
        sourceFiles, onDownloadFile, onDeleteFile, deleteFileLoadingId,
    } = props

    const {
        form, setForm, errors, isFormOpen, openAddTranslator, closeModals, submitTranslator,
        traffic,
        isInlineTrafficOpen, setIsInlineTrafficOpen, inlineTrafficForm, setInlineTrafficForm, inlineTrafficLoading, createAndSelectTraffic,
        currencies: hookCurrencies, languagePairs, languages: hookLanguages, categories,
        isNewPairModalOpen, setIsNewPairModalOpen, newPairForm, setNewPairForm, newPairLoading, createAndSelectLanguagePair
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

    const [isManualStats, setIsManualStats] = useState(false)
    const [manualStats, setManualStats] = useState({
        pages: "",
        charsWithSpaces: "",
        charsNoSpaces: "",
        images: ""
    })

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

    const selectedTariffObj = useMemo(
        () => tariffs?.find((tr) => String(tr.id) === trafficId),
        [tariffs, trafficId]
    )

    const isActionBasedTariff = useMemo(() => {
        if (!selectedTariffObj) { return false }
        return isActionOnlyRate(selectedTariffObj.price_per_page, selectedTariffObj.price_per_action)
    }, [selectedTariffObj])

    const clientReferenceRate = useMemo(() => {
        if (!selectedTariffObj) { return 0 }
        const basePrice = isActionBasedTariff
            ? (selectedTariffObj.price_per_action ? parseFloat(selectedTariffObj.price_per_action) : 0)
            : (selectedTariffObj.price_per_page ? parseFloat(selectedTariffObj.price_per_page) : 0)
        if (activeDiscount > 0 && basePrice > 0) {
            return basePrice * (1 - activeDiscount / 100)
        }
        return basePrice
    }, [selectedTariffObj, activeDiscount, isActionBasedTariff])

    const priceSummary: PriceSummary | null = useMemo(() => {
        if (!selectedTariffObj) { return null }

        if (isActionBasedTariff) {
            const rate = selectedTariffObj.price_per_action ? parseFloat(selectedTariffObj.price_per_action) : 0
            const filesCount = files.length
            const clientTotal = rate * filesCount

            const currentTranslator = translators.find((tr) => tr.id === selectedTranslatorId)
            const selectedTt = currentTranslator?.traffic?.find((tt: any) => String(tt.id) === translatorTrafficId)
            const translatorRate = selectedTt?.rate_per_action ? parseFloat(selectedTt.rate_per_action) : null
            const translatorTotal = translatorRate != null ? translatorRate * filesCount : null

            return { mode: "action", rate, filesCount, clientTotal, translatorTotal }
        }

        if (!priceData) { return null }
        return {
            mode: "page",
            pages: priceData.pages,
            clientTotal: priceData.total_client_price ? parseFloat(priceData.total_client_price) : 0,
            translatorTotal: priceData.translator_total ? parseFloat(priceData.translator_total) : null,
        }
    }, [selectedTariffObj, isActionBasedTariff, files.length, translators, selectedTranslatorId, translatorTrafficId, priceData])

    const baseAutoPrice = priceSummary?.clientTotal ?? 0
    const discountedAutoPrice = activeDiscount > 0 && baseAutoPrice > 0
        ? (baseAutoPrice * (1 - activeDiscount / 100)).toFixed(2)
        : (baseAutoPrice > 0 ? baseAutoPrice.toFixed(2) : "")

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
                filesConfirmed,
                files,
                currentStep,
                isManualStats,
                manualStats
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

        onSubmit({
            manualStats: isManualStats ? manualStats : null
        })
    }

    const stepValidation = (step: number): boolean => {
        if (mode === "edit") return true;

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
        if (mode === "edit") return null;

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
        if (isActionBasedTariff) { return }
        handleCalculatePrice()
    }, [filesConfirmed, trafficId, selectedTranslatorId, translatorTrafficId, isActionBasedTariff])

    useEffect(() => {
        if (isActionBasedTariff) {
            setPriceData(null)
        }
    }, [isActionBasedTariff])

    const enrichedTranslators = useMemo(() => {
        const filteredTranslators = translators.filter(translator => {
            if (!trafficId || !selectedTariffObj) return true;
            if (!translator.traffic || translator.traffic.length === 0) return false;

            return translator.traffic.some((t: any) => {
                if (isActionBasedTariff) {
                    return Number(t.rate_per_action) > 0;
                } else {
                    return Number(t.rate_per_page) > 0;
                }
            });
        });

        return filteredTranslators.map(translator => {
            if (!translator.traffic || translator.traffic.length === 0) { return translator }
            const hasProfitable = translator.traffic.some((t: any) => {
                if (isActionBasedTariff && !(Number(t.rate_per_action) > 0)) return false;
                if (!isActionBasedTariff && !(Number(t.rate_per_page) > 0)) return false;

                const rateField = isActionBasedTariff ? t.rate_per_action : t.rate_per_page
                const tRate = rateField ? parseFloat(rateField) : Infinity
                return clientReferenceRate > 0 && tRate < clientReferenceRate
            })
            return {
                ...translator,
                full_name: hasProfitable ? `✅ ${translator.full_name} (Є вигідний тариф)` : translator.full_name,
            }
        })
    }, [translators, trafficId, selectedTariffObj, clientReferenceRate, isActionBasedTariff])

    const translatorTrafficOptions: { value: string; label: string; meta: TranslatorTrafficMeta }[] = useMemo(() => {
        const currentTranslator = translators.find(t => t.id === selectedTranslatorId)
        if (!currentTranslator?.traffic) { return [] }

        const matchingTraffic = currentTranslator.traffic.filter((t: any) => {
            if (!trafficId) return true;
            if (isActionBasedTariff) return Number(t.rate_per_action) > 0;
            return Number(t.rate_per_page) > 0;
        });

        return matchingTraffic.map((t: any) => {
            const rateField = isActionBasedTariff ? t.rate_per_action : t.rate_per_page
            const tRate = rateField ? parseFloat(rateField) : 0
            const margin = clientReferenceRate - tRate
            const marginPercent = clientReferenceRate > 0 ? ((margin / clientReferenceRate) * 100).toFixed(1) : 0
            const isProfitable = clientReferenceRate > 0 && tRate < clientReferenceRate

            return {
                value: String(t.id),
                label: t.name || 'Особистий тариф',
                meta: {
                    rate_per_page: t.rate_per_page,
                    rate_per_action: t.rate_per_action,
                    currency: t.currency_sign || '',
                    isProfitable,
                    marginStr: clientReferenceRate > 0 ? `${margin.toFixed(2)} (${marginPercent}%)` : null,
                } satisfies TranslatorTrafficMeta,
            }
        })
    }, [selectedTranslatorId, translators, clientReferenceRate, isActionBasedTariff, trafficId])

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
                                setIsManualStats(false)
                            }}
                        />

                        {mode === "edit" && sourceFiles && sourceFiles.length > 0 && (
                            <div className="mt-3 space-y-1.5 px-1">
                                {sourceFiles.map((file) => (
                                    <div key={file.id} className="flex items-center justify-between py-1.5">
                                        <button
                                            type="button"
                                            onClick={() => onDownloadFile && onDownloadFile(file.id, file.name)}
                                            className="flex items-center gap-2 overflow-hidden text-sm text-slate-600 hover:text-blue-600 transition-colors text-left"
                                            title="Завантажити файл"
                                        >
                                            <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                                            <span className="truncate">{file.name}</span>
                                        </button>

                                        <div className="flex items-center gap-3 shrink-0 ml-4">
                                            <span className="text-[11px] text-slate-400">Вже завантажено</span>
                                            <button
                                                type="button"
                                                onClick={() => onDeleteFile && onDeleteFile(file.id)}
                                                disabled={deleteFileLoadingId === file.id}
                                                className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50 flex items-center justify-center p-1 rounded-md hover:bg-slate-100"
                                            >
                                                {deleteFileLoadingId === file.id ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <X className="h-3.5 w-3.5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

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
                                        <input
                                            type="checkbox"
                                            checked={isManualStats}
                                            onChange={(e) => setIsManualStats(e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className="text-sm font-medium text-gray-700">
                                            Редагувати вручну
                                        </span>
                                    </label>
                                </div>

                                <div className="p-4">
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="flex flex-col space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                                                <FileText className="w-3.5 h-3.5 text-gray-400" />
                                                {t("orders.autoPages")}
                                            </span>
                                            {isManualStats ? (
                                                <Input
                                                    type="number" min="0" className="h-8 mt-1 font-semibold text-blue-700 bg-white"
                                                    value={manualStats.pages}
                                                    onChange={(e) => setManualStats(p => ({ ...p, pages: e.target.value }))}
                                                />
                                            ) : (
                                                <span className="text-lg font-bold text-gray-900">{manualStats.pages}</span>
                                            )}
                                        </div>

                                        <div className="flex flex-col space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                                                <Type className="w-3.5 h-3.5 text-gray-400" />
                                                {t("common.withSpaces")}
                                            </span>
                                            {isManualStats ? (
                                                <Input
                                                    type="number" min="0" className="h-8 mt-1 font-semibold text-blue-700 bg-white"
                                                    value={manualStats.charsWithSpaces}
                                                    onChange={(e) => setManualStats(p => ({ ...p, charsWithSpaces: e.target.value }))}
                                                />
                                            ) : (
                                                <span className="text-lg font-bold text-gray-900">{manualStats.charsWithSpaces}</span>
                                            )}
                                        </div>

                                        <div className="flex flex-col space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                                                <Type className="w-3.5 h-3.5 text-gray-400" />
                                                {t("common.withoutSpaces")}
                                            </span>
                                            {isManualStats ? (
                                                <Input
                                                    type="number" min="0" className="h-8 mt-1 font-semibold text-blue-700 bg-white"
                                                    value={manualStats.charsNoSpaces}
                                                    onChange={(e) => setManualStats(p => ({ ...p, charsNoSpaces: e.target.value }))}
                                                />
                                            ) : (
                                                <span className="text-lg font-bold text-gray-900">{manualStats.charsNoSpaces}</span>
                                            )}
                                        </div>

                                        <div className="flex flex-col space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                                                <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                                                {t("common.images")}
                                            </span>
                                            {isManualStats ? (
                                                <Input
                                                    type="number" min="0" className="h-8 mt-1 font-semibold text-blue-700 bg-white"
                                                    value={manualStats.images}
                                                    onChange={(e) => setManualStats(p => ({ ...p, images: e.target.value }))}
                                                />
                                            ) : (
                                                <span className="text-lg font-bold text-gray-900">{manualStats.images}</span>
                                            )}
                                        </div>
                                    </div>

                                    {isManualStats && (
                                        <div className="mt-4 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <span className="text-blue-500 mt-0.5">ℹ️</span>
                                            <p className="text-blue-800 text-xs sm:text-sm leading-relaxed">
                                                Ви редагуєте статистику вручну. Автоматичний прорахунок ціни базується на оригінальних файлах, тому <strong>рекомендуємо вказати фінальну ціну вручну</strong> на останньому кроці.
                                            </p>
                                        </div>
                                    )}

                                    {!isManualStats && Number(manualStats.images) > 0 && (
                                        <div className="mt-4 flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <span className="text-yellow-500 mt-0.5">⚠️</span>
                                            <p className="text-yellow-700 text-xs sm:text-sm leading-relaxed">
                                                Документ містить <strong>{manualStats.images}</strong> зображень. Текст у зображеннях не враховується автоматично — підрахунок може бути некоректним.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {analysisResult && (
                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 text-sm">
                                <p className="text-purple-700 font-semibold mb-3 flex items-center gap-2">
                                    <Settings2 className="w-4 h-4" /> {t("orders.ocrCompleted")}
                                </p>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-white p-3 rounded-lg border border-purple-100">
                                        <p className="text-xs text-gray-500 mb-1">{t("orders.ocrTotalImages")}</p>
                                        <p className="font-semibold text-gray-800">{analysisResult.total_images_found}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-purple-100">
                                        <p className="text-xs text-gray-500 mb-1">{t("orders.ocrTotalSymbols")}</p>
                                        <p className="font-semibold text-gray-800">{analysisResult.total_detected_symbols_from_images}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {analysisResult.results?.map((r: any, idx: number) => (
                                        <div key={idx} className="p-3 bg-white rounded-lg border border-purple-100/50">
                                            <div className="font-medium text-gray-800 mb-1">{r.filename} <span className="text-xs text-gray-400 font-normal">({r.file_type})</span></div>
                                            {r.error ? (
                                                <div className="text-red-600 text-xs bg-red-50 p-2 rounded">{r.error}</div>
                                            ) : (
                                                <div className="flex items-center gap-4 text-xs text-gray-600">
                                                    <span>{t("common.images")}: <strong>{r.images_found}</strong></span>
                                                    <span>{t("orders.symbols")}: <strong>{r.detected_symbols_from_images}</strong></span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {imagesAnalyzed && !analysisLoading && (
                            <div className="text-green-600 text-sm font-medium flex items-center gap-1.5 bg-green-50 p-3 rounded-lg border border-green-100">
                                ✅ {t("orders.imagesAnalysisCompleted")}
                            </div>
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
                                renderOption={(option) => {
                                    const actionOnly = isActionOnlyRate(option.meta?.price_per_page, option.meta?.price_per_action)
                                    return (
                                        <div className="flex flex-col w-full py-1 gap-1.5">
                                            <div className="flex items-start justify-between w-full gap-2">
                                                <span className="font-medium text-foreground">{option.label}</span>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {actionOnly && (
                                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100/80 text-purple-700 text-[10px] font-semibold tracking-wide uppercase">
                                                            <Zap className="h-2.5 w-2.5" />
                                                            За дію
                                                        </span>
                                                    )}
                                                    {option.meta?.category && (
                                                        <span className="px-2 py-0.5 rounded-md bg-blue-100/80 text-blue-700 text-[10px] font-semibold tracking-wide uppercase">
                                                            {option.meta.category}
                                                        </span>
                                                    )}
                                                </div>
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
                                    )
                                }}
                                renderSelected={(option) => {
                                    const actionOnly = isActionOnlyRate(option.meta?.price_per_page, option.meta?.price_per_action)
                                    return (
                                        <div className="flex w-full items-center justify-between pr-4 gap-2">
                                            <span className="truncate font-medium text-foreground">{option.label}</span>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {option.meta?.category && (
                                                    <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium text-muted-foreground">
                                                        {option.meta.category}
                                                    </span>
                                                )}
                                                {actionOnly ? (
                                                    <span className="flex items-center gap-1 text-[11px] text-purple-700 font-semibold bg-purple-100/50 px-2 py-0.5 rounded-md border border-purple-200/50">
                                                        <Zap className="h-3 w-3" />
                                                        {option.meta?.price_per_action ?? 0} / дію
                                                    </span>
                                                ) : (option.meta?.price_per_page != null || option.meta?.price_per_action != null) && (
                                                    <span className="text-[11px] text-green-700 font-semibold bg-green-100/50 px-2 py-0.5 rounded-md border border-green-200/50">
                                                        {option.meta?.price_per_page ?? 0} / {t("orders.perPageShort")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                }}
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

                        {isActionBasedTariff && (
                            <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-4 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-sm text-purple-700">
                                    <Zap className="h-4 w-4 shrink-0" />
                                    <span>
                                        Тариф за дію: {selectedTariffObj?.price_per_action} × {files.length} {pluralFilesUk(files.length)}
                                    </span>
                                </div>
                                <span className="font-semibold text-purple-800 whitespace-nowrap">
                                    {(Number(selectedTariffObj?.price_per_action || 0) * files.length).toFixed(2)}{" "}
                                    {currencies.find((c) => String(c.id) === currencyId)?.code || ""}
                                </span>
                            </div>
                        )}
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
                                        const matchingTraffic = selectedTranslator.traffic.filter((t: any) => {
                                            if (!trafficId) return true;
                                            if (isActionBasedTariff) return Number(t.rate_per_action) > 0;
                                            return Number(t.rate_per_page) > 0;
                                        });

                                        if (matchingTraffic.length > 0) {
                                            const rateKey = isActionBasedTariff ? "rate_per_action" : "rate_per_page"
                                            const bestTariff = [...matchingTraffic].sort((a, b) => {
                                                const rateA = a[rateKey] ? parseFloat(a[rateKey]) : Infinity
                                                const rateB = b[rateKey] ? parseFloat(b[rateKey]) : Infinity
                                                return rateA - rateB
                                            })[0]
                                            setTranslatorTrafficId(String(bestTariff.id))
                                        } else {
                                            setTranslatorTrafficId("")
                                        }
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
                                                {!isActionBasedTariff && option.meta?.rate_per_page != null && (
                                                    <span className="flex items-center gap-1">
                                                        {t("orders.page")}: <span className="font-semibold text-gray-700">{option.meta.rate_per_page} {option.meta.currency}</span>
                                                    </span>
                                                )}
                                                {isActionBasedTariff && option.meta?.rate_per_action != null && (
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
                                                {(!isActionBasedTariff && option.meta?.rate_per_page != null) && (
                                                    <span className="text-[11px] text-orange-700 font-semibold bg-orange-100/50 px-2 py-0.5 rounded-md border border-orange-200/50">
                                                        {option.meta.rate_per_page} {option.meta.currency}
                                                    </span>
                                                )}
                                                {(isActionBasedTariff && option.meta?.rate_per_action != null) && (
                                                    <span className="text-[11px] text-orange-700 font-semibold bg-orange-100/50 px-2 py-0.5 rounded-md border border-orange-200/50">
                                                        {option.meta.rate_per_action} {option.meta.currency}
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
                                    <p className="text-xs text-red-500">У цього перекладача немає відповідного тарифу!</p>
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
                                <p>• {t("orders.tariff")}: {tariffs?.find((t) => String(t.id) === trafficId)?.name || t("orders.notSelected")}{isActionBasedTariff ? " (за дію)" : ""}</p>
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

                        let realMargin: string | null = null
                        let isMarginNegative = false

                        if (priceSummary?.translatorTotal != null && effectivePrice !== "-") {
                            const currentClientPrice = parseFloat(String(effectivePrice))
                            const translatorCost = priceSummary.translatorTotal
                            if (!isNaN(currentClientPrice) && !isNaN(translatorCost)) {
                                const marginValue = currentClientPrice - translatorCost
                                realMargin = marginValue.toFixed(2)
                                isMarginNegative = marginValue < 0
                            }
                        }

                        return (
                            <div className="space-y-6">
                                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <BarChart2 className="h-4 w-4 text-blue-600" />
                                    Підсумкова статистика
                                </h3>

                                {statsResult ? (
                                    <>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <div className="bg-gray-50 border border-gray-100 p-3 rounded-lg text-center">
                                                <div className="text-xs text-gray-500 mb-1">{t("orders.autoPages")}</div>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    className="h-8 text-center font-bold text-gray-800 bg-white"
                                                    value={manualStats.pages}
                                                    onChange={(e) => {
                                                        setIsManualStats(true)
                                                        setManualStats(p => ({ ...p, pages: e.target.value }))
                                                    }}
                                                />
                                            </div>
                                            <div className="bg-gray-50 border border-gray-100 p-3 rounded-lg text-center">
                                                <div className="text-xs text-gray-500 mb-1">{t("common.withSpaces")}</div>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    className="h-8 text-center font-bold text-gray-800 bg-white"
                                                    value={manualStats.charsWithSpaces}
                                                    onChange={(e) => {
                                                        setIsManualStats(true)
                                                        setManualStats(p => ({ ...p, charsWithSpaces: e.target.value }))
                                                    }}
                                                />
                                            </div>
                                            <div className="bg-gray-50 border border-gray-100 p-3 rounded-lg text-center">
                                                <div className="text-xs text-gray-500 mb-1">{t("common.withoutSpaces")}</div>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    className="h-8 text-center font-bold text-gray-800 bg-white"
                                                    value={manualStats.charsNoSpaces}
                                                    onChange={(e) => {
                                                        setIsManualStats(true)
                                                        setManualStats(p => ({ ...p, charsNoSpaces: e.target.value }))
                                                    }}
                                                />
                                            </div>
                                            <div className="bg-gray-50 border border-gray-100 p-3 rounded-lg text-center">
                                                <div className="text-xs text-gray-500 mb-1">{t("common.images")}</div>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    className="h-8 text-center font-bold text-gray-800 bg-white"
                                                    value={manualStats.images}
                                                    onChange={(e) => {
                                                        setIsManualStats(true)
                                                        setManualStats(p => ({ ...p, images: e.target.value }))
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {isActionBasedTariff && (
                                            <div className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs sm:text-sm text-purple-800">
                                                <Zap className="h-4 w-4 mt-0.5 shrink-0" />
                                                <p className="leading-relaxed">
                                                    Обраний тариф розраховує вартість за кількістю файлів ({files.length}), а не за сторінками чи символами. Статистика вище — довідкова.
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
                                                            placeholder={priceSummary ? priceSummary.clientTotal.toFixed(2) : "0.00"}
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

                                        {priceSummary && !priceLoading && (
                                            <div className={`rounded-xl border p-4 space-y-2 text-sm ${isManualStats ? 'bg-gray-50 border-gray-200' : 'bg-green-50 border-green-200'}`}>
                                                <div className="flex items-center justify-between">
                                                    <p className={`font-semibold ${isManualStats ? 'text-gray-600' : 'text-green-700'}`}>{t("orders.priceCalculation")}</p>
                                                    {isActionBasedTariff && (
                                                        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                                                            <Zap className="h-2.5 w-2.5" />
                                                            За дію
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">
                                                        {isActionBasedTariff
                                                            ? `${t("orders.autoBasePrice")} (${priceSummary.rate} × ${priceSummary.filesCount} ${pluralFilesUk(priceSummary.filesCount ?? 0)})`
                                                            : `${t("orders.autoBasePrice")} (${priceSummary.pages} стор.)`}
                                                    </span>
                                                    <span className="font-medium">{priceSummary.clientTotal.toFixed(2)} {orderCurrency}</span>
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
                                                <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                                                    <span className="text-gray-800 font-semibold">{t("orders.amountDue")}</span>
                                                    <span className={`font-bold ${isManualStats ? 'text-gray-700' : 'text-green-700'}`}>
                                                        {discountedAutoPrice || priceSummary.clientTotal.toFixed(2)} {orderCurrency}
                                                    </span>
                                                </div>
                                                {priceSummary.translatorTotal != null && (
                                                    <>
                                                        <div className="flex justify-between mt-4">
                                                            <span className="text-gray-600">{t("orders.translatorCost")}</span>
                                                            <span className="font-medium">{priceSummary.translatorTotal.toFixed(2)} {orderCurrency}</span>
                                                        </div>
                                                        <div className="flex justify-between border-t border-gray-200 pt-2 mt-1">
                                                            <span className="text-gray-600">{t("orders.margin")}</span>
                                                            <span className={`font-semibold ${isMarginNegative ? 'text-red-600' : (isManualStats ? 'text-gray-700' : 'text-green-700')}`}>
                                                                {realMargin ?? "-"} {orderCurrency}
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

            {/* ─── MODAL: ПЕРЕКЛАДАЧ ─── */}
            <BaseFormModal
                open={isFormOpen}
                onOpenChange={(open) => !open && closeModals()}
                title={t("translators.create")}
                description={t("translators.createDescription")}
                icon={<UserPlus className="h-8 w-8" />}
                variant="reference"
                submitLabel={t("common.save")}
                onSubmit={handleQuickCreateTranslator}
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
                </div>
            </BaseFormModal>

            {/* ─── MODAL: INLINE TRAFFIC ─── */}
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
                                {hookCurrencies.map((currency) => (
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

            {/* ─── MODAL: NEW LANGUAGE PAIR ─── */}
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
                                {hookLanguages.map((language) => (
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
                                {hookLanguages
                                    .filter((language) => language.id !== newPairForm.source_language)
                                    .map((language) => (
                                        <SelectItem key={language.id} value={String(language.id)}>{language.name}</SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </ModalField>
                </div>
            </BaseFormModal>
        </>
    )
}