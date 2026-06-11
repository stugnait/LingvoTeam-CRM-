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

export function CreateOrderModal(props: CreateOrderModalProps) {
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
                const newTranslator = freshTranslators.find((t: any) => t.email === form.email);
                if (newTranslator) {
                    setSelectedTranslatorId(newTranslator.id);
                    if (newTranslator.traffic && newTranslator.traffic.length > 0) {
                        setTranslatorTrafficId(String(newTranslator.traffic[0].id));
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
                    if (d.clientId) {setClientId(d.clientId)}
                    if (d.sourceLanguage) {setSourceLanguage(d.sourceLanguage)}
                    if (d.targetLanguage) {setTargetLanguage(d.targetLanguage)}
                    if (d.trafficId) {setTrafficId(d.trafficId)}
                    if (d.currencyId) {setCurrencyId(d.currencyId)}
                    if (d.editor) {setEditor(d.editor)}
                    if (d.managerAccept) {setManagerAccept(d.managerAccept)}
                    if (d.managerDelivery) {setManagerDelivery(d.managerDelivery)}
                    if (d.selectedTranslatorId) {setSelectedTranslatorId(d.selectedTranslatorId)}
                    if (d.translatorTrafficId) {setTranslatorTrafficId(d.translatorTrafficId)}
                    if (d.comment) {setComment(d.comment)}
                    if (d.priority) {setPriority(d.priority)}
                    if (d.deadline) {setDeadline(new Date(d.deadline))}
                    if (d.customDiscount) {setCustomDiscount(d.customDiscount)}
                    if (d.totalAmount) {setTotalAmount(d.totalAmount)}

                    if (d.currentStep !== undefined) {setCurrentStep(d.currentStep)}

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
        if (!open || mode === "edit" || !isRestored) {return}

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
                currentStep
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
        customDiscount, totalAmount, files, filesConfirmed, currentStep, open, isRestored, mode
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
            if (selectedTranslatorId) {formData.append("translator_id", String(selectedTranslatorId))}
            if (translatorTrafficId) {formData.append("translator_traffic_id", translatorTrafficId)}
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
            await localforage.removeItem(DRAFT_KEY);
        } catch (error) {
            console.error("Помилка видалення чернетки:", error);
        }
        onSubmit();
    }

    // ─── Validation ─────────────────────────────────────────────────────────

    const stepValidation = (step: number): boolean => {
        switch (step) {
            case 0:
                return !!clientId && !!sourceLanguage && !!targetLanguage && files.length > 0 && filesConfirmed
            case 1:
                return !!trafficId && !!currencyId
            case 2:
                const isTranslatorValid = selectedTranslatorId ? !!translatorTrafficId : true;
                return isTranslatorValid && !!editor && !!managerAccept && !!managerDelivery
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
                if (!clientId) {return "Оберіть клієнта"}
                if (!sourceLanguage) {return "Оберіть мову оригіналу"}
                if (!targetLanguage) {return "Оберіть мову перекладу"}
                if (!files.length) {return "Завантажте хоча б один файл"}
                if (!filesConfirmed) {return "Підтвердіть файли кнопкою «Confirm files»"}
                return null
            case 1:
                if (!trafficId) {return "Оберіть тариф"}
                if (!currencyId) {return "Оберіть валюту"}
                return null
            case 2:
                if (selectedTranslatorId && !translatorTrafficId) {return "Оберіть тариф для перекладача"}
                if (!editor) {return "Оберіть редактора"}
                if (!managerAccept) {return "Оберіть менеджера на прийом"}
                if (!managerDelivery) {return "Оберіть менеджера на здачу"}
                return null
            case 3:
                if (!priority) {return "Оберіть пріоритет"}
                if (!deadline) {return "Вкажіть дедлайн"}
                if (!comment.trim()) {return "Будь ласка, додайте коментар"}
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

    // 🔥 ДОДАНО: Перевірка вигідності для списку перекладачів (ціна клієнта)
    const clientPricePerPage = useMemo(() => {
        const clientTariff = tariffs?.find((t) => String(t.id) === trafficId);
        const basePrice = clientTariff?.price_per_page ? parseFloat(clientTariff.price_per_page) : 0;

        if (activeDiscount > 0 && basePrice > 0) {
            return basePrice * (1 - activeDiscount / 100);
        }
        return basePrice;
    }, [trafficId, tariffs, activeDiscount]);

    // Збагачуємо масив перекладачів міткою ✅, якщо в них є хоч один прибутковий тариф
    const enrichedTranslators = useMemo(() => {
        return translators.map(translator => {
            if (!translator.traffic || translator.traffic.length === 0) return translator;

            const hasProfitable = translator.traffic.some((t: any) => {
                const tRate = t.rate_per_page ? parseFloat(t.rate_per_page) : Infinity;
                return clientPricePerPage > 0 && tRate < clientPricePerPage;
            });

            return {
                ...translator,
                full_name: hasProfitable ? `✅ ${translator.full_name} (Є вигідний тариф)` : translator.full_name
            };
        });
    }, [translators, clientPricePerPage]);

    // Формуємо список тарифів і відразу рахуємо маржу для відображення в селекті
    const translatorTrafficOptions = useMemo(() => {
        const currentTranslator = translators.find(t => t.id === selectedTranslatorId);
        if (!currentTranslator?.traffic) {return [];}

        return currentTranslator.traffic.map((t: any) => {
            const tRate = t.rate_per_page ? parseFloat(t.rate_per_page) : 0;
            const margin = clientPricePerPage - tRate;
            const marginPercent = clientPricePerPage > 0 ? ((margin / clientPricePerPage) * 100).toFixed(1) : 0;
            const isProfitable = clientPricePerPage > 0 && tRate < clientPricePerPage;

            return {
                value: String(t.id),
                label: t.name || 'Особистий тариф',
                meta: {
                    rate_per_page: t.rate_per_page,
                    rate_per_action: t.rate_per_action,
                    currency: t.currency_sign || '',
                    isProfitable,
                    marginStr: clientPricePerPage > 0 ? `${margin.toFixed(2)} (${marginPercent}%)` : null
                }
            }
        });
    }, [selectedTranslatorId, translators, clientPricePerPage]);

    // ─── Render ─────────────────────────────────────────────────────────────

    if (open && !isRestored && mode !== "edit") {
        return null;
    }

    return (
        <>
            <WizardModal
                open={open}
                onOpenChange={onOpenChange}
                title={mode === "edit" ? "Edit Order" : "Create New Order"}
                step={currentStep}
                onStepChange={setCurrentStep}
                steps={[
                    { title: "Client & Files" },
                    { title: "Tariff" },
                    { title: "Assignment" },
                    { title: "Deadline" },
                    { title: "Statistics" },
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
                                Client *
                            </label>
                            <Combobox
                                value={clientId}
                                onChange={setClientId}
                                placeholder="Select client"
                                options={clients.map((c) => ({
                                    value: String(c.id),
                                    label: c.full_name,
                                }))}
                                renderSelected={(option) => {
                                    const c = clients.find((cl) => String(cl.id) === option.value)
                                    if (!c) {return option.label}
                                    return (
                                        <div className="flex items-center gap-2">
                                            <span>{c.full_name}</span>
                                            {c.category_name && (
                                                <span className="text-xs text-muted-foreground">
                                                    Категорія: {c.category_name}{c.discount_percent ? ` · Знижка: ${c.discount_percent}%` : ""}
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
                                                    ? `Категорія: ${c.category_name}${c.discount_percent ? ` · Знижка: ${c.discount_percent}%` : ""}`
                                                    : "Без категорії"
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
                                placeholder="Source language"
                                options={languages.map((l) => ({ value: String(l.id), label: l.name }))}
                            />
                            <Combobox
                                value={targetLanguage}
                                onChange={setTargetLanguage}
                                placeholder="Target language"
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
                                {statsLoading ? "Calculating..." : "Confirm files"}
                            </button>
                        )}

                        {filesConfirmed && statsResult && (
                            <div className="bg-gray-100 p-4 rounded-lg text-sm space-y-1">
                                <p>Pages: {statsResult.total_stats.physical_pages}</p>
                                <p>Chars (with spaces): {statsResult.total_stats.chars_with_spaces}</p>
                                <p>Chars (without spaces): {statsResult.total_stats.chars_no_spaces}</p>
                                <p>Images: {statsResult.total_stats.images}</p>

                                {statsResult.total_stats.images > 0 && (
                                    <div className="mt-3 flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <span className="text-yellow-500 mt-0.5">⚠️</span>
                                        <p className="text-yellow-700 text-xs leading-relaxed">
                                            Документ містить <strong>{statsResult.total_stats.images}</strong> зображень.
                                            Текст у зображеннях не враховується автоматично — підрахунок може бути некоректним.
                                            Рекомендуємо використати аналіз зображень (OCR) нижче.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {analysisResult && (
                            <div className="bg-purple-50 p-4 rounded-lg text-sm">
                                <p className="text-purple-700 font-medium">OCR completed successfully</p>
                                <p>Total images found: {analysisResult.total_images_found}</p>
                                <p>Total detected symbols: {analysisResult.total_detected_symbols_from_images}</p>
                                <div className="mt-3 space-y-2">
                                    {analysisResult.results?.map((r: any, idx: number) => (
                                        <div key={idx} className="p-2 bg-white rounded border">
                                            <div className="font-medium">{r.filename} ({r.file_type})</div>
                                            {r.error ? (
                                                <div className="text-red-600">{r.error}</div>
                                            ) : (
                                                <>
                                                    <div>Images: {r.images_found}</div>
                                                    <div>Symbols: {r.detected_symbols_from_images}</div>
                                                    {r.preview_text && <div className="text-gray-600">{r.preview_text}</div>}
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {imagesAnalyzed && !analysisLoading && (
                            <div className="text-green-600 text-sm font-medium">✅ Images analysis completed</div>
                        )}
                    </div>
                </WizardStep>

                {/* ── Крок 2: Tariff ── */}
                <WizardStep>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Tag className="h-4 w-4 text-blue-600" />
                                Tariff <span className="text-red-500">*</span>
                            </label>
                            <Combobox
                                value={trafficId}
                                onChange={setTrafficId}
                                placeholder="Select tariff"
                                searchPlaceholder="Search tariff..."
                                options={tariffs?.map((tariff) => ({
                                    value: String(tariff.id),
                                    label: tariff.name,
                                    meta: {
                                        category: tariff.category_name,
                                        price_per_page: tariff.price_per_page,
                                        price_per_action: tariff.price_per_action
                                    }
                                }))}
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
                                            {option.meta?.price_per_page !== undefined && option.meta?.price_per_page !== null && (
                                                <span className="flex items-center gap-1">
                                                    Сторінка: <span className="font-semibold text-gray-700">{option.meta.price_per_page}</span>
                                                </span>
                                            )}
                                            {option.meta?.price_per_page !== null && option.meta?.price_per_action !== null && (
                                                <span className="w-1 h-1 rounded-full bg-border"></span>
                                            )}
                                            {option.meta?.price_per_action !== undefined && option.meta?.price_per_action !== null && (
                                                <span className="flex items-center gap-1">
                                                    Дія: <span className="font-semibold text-gray-700">{option.meta.price_per_action}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                renderSelected={(option) => (
                                    <div className="flex w-full items-center justify-between pr-4 gap-2">
                                        <span className="truncate font-medium text-foreground">
                                            {option.label}
                                        </span>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {option.meta?.category && (
                                                <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium text-muted-foreground">
                                                    {option.meta.category}
                                                </span>
                                            )}
                                            {(option.meta?.price_per_page !== undefined || option.meta?.price_per_action !== undefined) && (
                                                <span className="text-[11px] text-green-700 font-semibold bg-green-100/50 px-2 py-0.5 rounded-md border border-green-200/50">
                                                    {option.meta?.price_per_page ?? 0} / стор.
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
                                Currency
                            </label>
                            <Combobox
                                value={currencyId}
                                onChange={setCurrencyId}
                                placeholder="Select currency"
                                searchPlaceholder="Search currency..."
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
                                    Quick Create
                                </Button>
                            </div>
                            <TranslatorSelect
                                value={selectedTranslatorId}
                                translators={enrichedTranslators} // 🔥 Передаємо збагачений масив з ✅
                                sourceLanguage={sourceLanguage}
                                targetLanguage={targetLanguage}
                                placeholder="Select translator (optional)"
                                orderTrafficId={trafficId ? Number(trafficId) : null}
                                onChange={(translatorId) => {
                                    setSelectedTranslatorId(translatorId)

                                    if (!translatorId) {
                                        setTranslatorTrafficId("")
                                        return
                                    }

                                    const selectedTranslator = translators.find(t => t.id === translatorId)

                                    if (selectedTranslator?.traffic && selectedTranslator.traffic.length > 0) {
                                        // 🔥 АВТОВИБІР НАЙКРАЩОГО ТАРИФУ
                                        const bestTariff = [...selectedTranslator.traffic].sort((a, b) => {
                                            const rateA = a.rate_per_page ? parseFloat(a.rate_per_page) : Infinity;
                                            const rateB = b.rate_per_page ? parseFloat(b.rate_per_page) : Infinity;
                                            return rateA - rateB; // Той, де ставка менша, іде першим
                                        })[0];

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
                                placeholder="Select editor (optional)"
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
                                placeholder="Select manager"
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
                                placeholder="Select manager"
                                options={managers.map((m) => ({ value: String(m.id), label: m.full_name }))}
                            />
                        </div>

                        {selectedTranslatorId && (
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <Tag className="h-4 w-4 text-orange-500" />
                                    Translator Traffic
                                </label>

                                <Combobox
                                    value={translatorTrafficId}
                                    onChange={setTranslatorTrafficId}
                                    placeholder="Select Traffic"
                                    options={translatorTrafficOptions}
                                    renderOption={(option) => (
                                        <div className="flex flex-col w-full py-1 gap-1.5">
                                            <div className="flex items-start justify-between w-full">
                                                <span className="font-medium text-foreground">{option.label}</span>
                                                {/* Маржа у випадаючому списку */}
                                                {option.meta?.marginStr && (
                                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${option.meta.isProfitable ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                                        Маржа: {option.meta.marginStr}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                {option.meta?.rate_per_page !== undefined && option.meta?.rate_per_page !== null && (
                                                    <span className="flex items-center gap-1">
                                                        Сторінка: <span className="font-semibold text-gray-700">{option.meta.rate_per_page} {option.meta.currency}</span>
                                                    </span>
                                                )}
                                                {option.meta?.rate_per_page !== null && option.meta?.rate_per_action !== null && (
                                                    <span className="w-1 h-1 rounded-full bg-border"></span>
                                                )}
                                                {option.meta?.rate_per_action !== undefined && option.meta?.rate_per_action !== null && (
                                                    <span className="flex items-center gap-1">
                                                        Дія: <span className="font-semibold text-gray-700">{option.meta.rate_per_action} {option.meta.currency}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    renderSelected={(option) => (
                                        <div className="flex w-full items-center justify-between pr-4 gap-2">
                                            <span className="truncate font-medium text-foreground">
                                                {option.label}
                                            </span>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {/* Ставка перекладача у вибраному стані */}
                                                {(option.meta?.rate_per_page !== undefined || option.meta?.rate_per_action !== undefined) && (
                                                    <span className="text-[11px] text-orange-700 font-semibold bg-orange-100/50 px-2 py-0.5 rounded-md border border-orange-200/50">
                                                        {option.meta?.rate_per_page ?? option.meta?.rate_per_action ?? 0} {option.meta?.currency}
                                                    </span>
                                                )}
                                                {/* 🔥 ДОДАНО: Маржа у вибраному стані 🔥 */}
                                                {option.meta?.marginStr && (
                                                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${option.meta.isProfitable ? 'bg-green-100/50 text-green-700 border-green-200/50' : 'bg-red-100/50 text-red-700 border-red-200/50'}`}>
                                                        Маржа: {option.meta.marginStr}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                />

                                {translatorTrafficOptions.length === 0 && (
                                    <p className="text-xs text-red-500">
                                        У цього перекладача немає тарифу!
                                    </p>
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
                                Deadline <span className="text-red-500">*</span>
                            </label>
                            <DeadlineSelector value={deadline} onChange={setDeadline} minDate={new Date()} />
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <MessageSquare className="h-4 w-4 text-blue-600" />
                                Comment
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Add any additional notes or instructions..."
                                className="w-full px-3 py-2 border rounded-md min-h-[120px] resize-y"
                            />
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium mb-2">Order Summary</h4>
                            <div className="space-y-1 text-sm text-gray-600">
                                <p>• Client: {clients.find((c) => String(c.id) === clientId)?.full_name || "Not selected"}</p>
                                <p>• Files: {files.length} file(s)</p>
                                <p>
                                    • Languages: {languages.find((l) => String(l.id) === sourceLanguage)?.name || "?"} →{" "}
                                    {languages.find((l) => String(l.id) === targetLanguage)?.name || "?"}
                                </p>
                                <p>• Tariff: {tariffs?.find((t) => String(t.id) === trafficId)?.name || "Not selected"}</p>
                                <p>• Priority: {priority || "none"}</p>
                                <p>• Deadline: {deadline?.toLocaleDateString() || "Not set"}</p>
                            </div>
                        </div>
                    </div>
                </WizardStep>

                {/* ── Крок 5: Statistics & Price ── */}
                <WizardStep>
                    {(() => {
                        // Знаходимо код вибраної валюти для відображення
                        const selectedCurrencyObj = currencies.find((c) => String(c.id) === currencyId);
                        const orderCurrency = selectedCurrencyObj ? selectedCurrencyObj.code : "";

                        // 🔥 ДОДАНО: Динамічний розрахунок реальної маржі
                        // Враховує знижку клієнта або ручний ввід ціни менеджером
                        let realMargin = priceData?.margin;
                        let isMarginNegative = false;

                        if (priceData?.translator_total && effectivePrice !== "-") {
                            const currentClientPrice = parseFloat(String(effectivePrice));
                            const translatorCost = parseFloat(priceData.translator_total);

                            if (!isNaN(currentClientPrice) && !isNaN(translatorCost)) {
                                const marginValue = currentClientPrice - translatorCost;
                                realMargin = marginValue.toFixed(2);
                                isMarginNegative = marginValue < 0;
                            }
                        } else if (priceData?.margin) {
                            isMarginNegative = parseFloat(priceData.margin) < 0;
                        }

                        return (
                            <div className="space-y-6">
                                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <BarChart2 className="h-4 w-4 text-blue-600" />
                                    Статистика файлів
                                </h3>

                                {statsResult ? (
                                    <>
                                        <div className="rounded-xl border divide-y text-sm">
                                            <div className="flex justify-between px-4 py-3">
                                                <span className="text-gray-500">Сторінок (авто)</span>
                                                <span className="font-medium">{statsResult.total_stats.physical_pages}</span>
                                            </div>
                                            <div className="flex justify-between px-4 py-3">
                                                <span className="text-gray-500">Символів з пробілами</span>
                                                <span className="font-medium">{statsResult.total_stats.chars_with_spaces}</span>
                                            </div>
                                            <div className="flex justify-between px-4 py-3">
                                                <span className="text-gray-500">Символів без пробілів</span>
                                                <span className="font-medium">{statsResult.total_stats.chars_no_spaces}</span>
                                            </div>
                                            <div className="flex justify-between px-4 py-3">
                                                <span className="text-gray-500">Зображень</span>
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
                                                Знижка на замовлення (%)
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
                                                    placeholder={`Стандартна: ${defaultDiscountPercent}%`}
                                                    className="w-32 px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <span className="text-xs text-gray-500">
                                                    Залишіть порожнім для standard discount ({defaultDiscountPercent}%)
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
                                                        if (!e.target.checked) {setTotalAmount(String(discountedAutoPrice))}
                                                    }}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                                                />
                                                <span className="text-sm font-medium text-gray-700">
                                                    Вказати ціну вручну
                                                </span>
                                            </label>

                                            {useManualPrice && (
                                                <div className="flex items-center gap-3 pl-7">
                                                    <span className="text-sm text-gray-500">Ціна для клієнта:</span>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={totalAmount}
                                                            onChange={(e) => setTotalAmount(e.target.value)}
                                                            placeholder={priceData?.total_client_price ?? "0.00"}
                                                            className="w-32 px-3 py-1.5 border rounded-lg text-sm
                                                                    focus:outline-none focus:ring-2 focus:ring-blue-300"
                                                        />
                                                        <span className="text-sm font-medium text-gray-600">{orderCurrency}</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="pl-7 text-sm text-gray-500">
                                                Фінальна ціна:{" "}
                                                <span className="font-semibold text-gray-800">{effectivePrice} {orderCurrency}</span>
                                            </div>
                                        </div>

                                        {priceLoading && (
                                            <div className="text-sm text-gray-400 text-center py-2">
                                                Розраховуємо ціну...
                                            </div>
                                        )}

                                        {priceData && !priceLoading && (
                                            <div className="rounded-xl border p-4 space-y-2 bg-green-50 text-sm">
                                                <p className="font-semibold text-green-700">Розрахунок ціни</p>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Сторінок (авто):</span>
                                                    <span className="font-medium">{priceData.pages}</span>
                                                </div>

                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Базова авто-ціна:</span>
                                                    <span className="font-medium">{priceData.total_client_price} {orderCurrency}</span>
                                                </div>
                                                {activeDiscount > 0 && (
                                                    <div className="flex justify-between text-blue-600 mt-1">
                                                        <span className="font-medium">
                                                            Знижка ({customDiscount !== "" ? "Ручна" : "Клієнта"} {activeDiscount}%):
                                                        </span>
                                                        <span className="font-bold">
                                                            -{ (baseAutoPrice * (activeDiscount / 100)).toFixed(2) } {orderCurrency}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between border-t border-green-200 pt-2 mt-2">
                                                    <span className="text-gray-800 font-semibold">Ціна до сплати:</span>
                                                    <span className="font-bold text-green-700">{discountedAutoPrice} {orderCurrency}</span>
                                                </div>

                                                {priceData.translator_rate_per_page && (
                                                    <>
                                                        <div className="flex justify-between mt-4">
                                                            <span className="text-gray-600">Вартість перекладача:</span>
                                                            <span className="font-medium">{priceData.translator_total} {orderCurrency}</span>
                                                        </div>
                                                        <div className="flex justify-between border-t border-green-200 pt-2 mt-1">
                                                            <span className="text-gray-600">Маржа:</span>
                                                            {/* 🔥 Враховуємо колір залежно від того, чи маржа в мінусі */}
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
                                        Статистика недоступна — поверніться і підтвердіть файли
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </WizardStep>
            </WizardModal>

            <BaseFormModal
                open={isFormOpen}
                onOpenChange={(open) => !open && closeModals()}
                title="Create New Translator"
                submitLabel="Save"
                onSubmit={handleQuickCreateTranslator}
            >
                <div className="space-y-4 pt-2">
                    <Input
                        placeholder="Full name"
                        value={form.full_name}
                        onChange={(e) => setForm(prev => ({ ...prev, full_name: e.target.value }))}
                    />
                    <Input
                        placeholder="Email"
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
                            setForm(prev => ({
                                ...prev,
                                phone: values.formattedValue,
                            }))
                        }}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            type="number"
                            min="0"
                            placeholder="Currency ID"
                            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            onKeyDown={(e) => {
                                if (["-", "e", "E", "+"].includes(e.key)) {
                                    e.preventDefault();
                                }
                            }}
                            onFocus={(e) => e.target.select()}
                            value={form.currency_id === 0 ? "" : form.currency_id}
                            onChange={(e) => {
                                const val = e.target.value;
                                const numericValue = val === "" ? 0 : Math.max(0, parseInt(val, 10));
                                setForm(prev => ({ ...prev, currency_id: numericValue }))
                            }}
                        />
                    </div>
                </div>
            </BaseFormModal>
        </>
    )
}