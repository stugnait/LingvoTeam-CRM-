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

    const [filesConfirmed, setFilesConfirmed] = useState(false)
    const [imagesAnalyzed, setImagesAnalyzed] = useState(false)
    const [editorOptions, setEditorOptions] = useState<EditorOption[]>([])
    const [priceData, setPriceData] = useState<any>(null)
    const [priceLoading, setPriceLoading] = useState(false)
    const [useManualPrice, setUseManualPrice] = useState(false)
    const [customDiscount, setCustomDiscount] = useState<string>("")

    // --- Логіка підрахунку знижки ---
    const selectedClient = clients.find((c) => String(c.id) === clientId)
    const defaultDiscountPercent = selectedClient?.discount_percent ? Number(selectedClient.discount_percent) : 0

    const activeDiscount = customDiscount !== "" ? Number(customDiscount) : defaultDiscountPercent

    const baseAutoPrice = priceData?.total_client_price ? parseFloat(priceData.total_client_price) : 0
    const discountedAutoPrice = activeDiscount > 0 && baseAutoPrice > 0
        ? (baseAutoPrice * (1 - activeDiscount / 100)).toFixed(2)
        : priceData?.total_client_price ?? ""

    // 🔥 ДОДАНО: Автоматично записуємо пораховану суму в стейт, який полетить на бекенд
    useEffect(() => {
        if (!useManualPrice && discountedAutoPrice) {
            setTotalAmount(String(discountedAutoPrice))
        }
    }, [discountedAutoPrice, useManualPrice, setTotalAmount])

    // Тепер effectivePrice завжди дорівнює totalAmount, бо стейт синхронізовано
    const effectivePrice = totalAmount || discountedAutoPrice || "-"

    // ─── Handlers ───────────────────────────────────────────────────────────

    const handleQuickCreateTranslator = async () => {
        await submitTranslator(form)

        // 2. Оновлюємо список і отримуємо його результат
        if (onRefreshTranslators) {
            const freshTranslators = await onRefreshTranslators()

            // Перевіряємо, чи повернувся масив і чи він не порожній
            if (Array.isArray(freshTranslators) && freshTranslators.length > 0) {
                // Шукаємо за email (найбільш унікальний параметр з форми)
                const newTranslator = freshTranslators.find((t: any) => t.email === form.email);

                if (newTranslator) {
                    // Встановлюємо ID перекладача
                    setSelectedTranslatorId(newTranslator.id);

                    // Якщо є тарифи — обираємо перший
                    if (newTranslator.traffic && newTranslator.traffic.length > 0) {
                        setTranslatorTrafficId(String(newTranslator.traffic[0].id));
                    }
                }
            }
        }

        closeModals()
    }

    const handleModalClose = (open: boolean) => {
        if (!open) {
            resetStats()
            setFilesConfirmed(false)
            setImagesAnalyzed(false)
            setPriceData(null)
            setTotalAmount("")
            setUseManualPrice(false)
            setCustomDiscount("")
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
            if (selectedTranslatorId) formData.append("translator_id", String(selectedTranslatorId))
            if (translatorTrafficId) formData.append("translator_traffic_id", translatorTrafficId)
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

    // ─── Validation ─────────────────────────────────────────────────────────

    const stepValidation = (step: number): boolean => {
        switch (step) {
            case 0: return !!clientId && !!sourceLanguage && !!targetLanguage && files.length > 0 && filesConfirmed
            case 1: return !!trafficId && !!currencyId
            case 2: return !!selectedTranslatorId && !!editor && !!managerAccept && !!managerDelivery
            case 3: return !!deadline && !!priority
            case 4: return true
            default: return true
        }
    }

    const stepError = (step: number): string | null => {
        switch (step) {
            case 0:
                if (!clientId) return "Оберіть клієнта"
                if (!sourceLanguage) return "Оберіть мову оригіналу"
                if (!targetLanguage) return "Оберіть мову перекладу"
                if (!files.length) return "Завантажте хоча б один файл"
                if (!filesConfirmed) return "Підтвердіть файли кнопкою «Confirm files»"
                return null
            case 1:
                if (!trafficId) return "Оберіть тариф"
                if (!currencyId) return "Оберіть валюту"
                return null
            case 2:
                if (!selectedTranslatorId) return "Оберіть перекладача"
                if (!editor) return "Оберіть редактора"
                if (!managerAccept) return "Оберіть менеджера на прийом"
                if (!managerDelivery) return "Оберіть менеджера на здачу"
                return null
            case 3:
                if (!priority) return "Оберіть пріоритет"
                if (!deadline) return "Вкажіть дедлайн"
                return null
            case 4: return null
            default: return null
        }
    }

    // ─── Effects ────────────────────────────────────────────────────────────

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


    const translatorTrafficOptions = useMemo(() => {
        const currentTranslator = translators.find(t => t.id === selectedTranslatorId);
        if (!currentTranslator?.traffic) return [];

        return currentTranslator.traffic.map((t: any) => ({
            value: String(t.id),
            label: t.name || 'Особистий тариф',
            description: `Ставка: ${t.rate_per_page || t.rate_per_action} ${t.currency_sign}`
        }));
    }, [selectedTranslatorId, translators]);
    // ─── Render ─────────────────────────────────────────────────────────────

    return (
        <>
            <WizardModal
                open={open}
                onOpenChange={onOpenChange}
                title={mode === "edit" ? "Edit Order" : "Create New Order"}
                steps={[
                    { title: "Client & Files" },
                    { title: "Tariff" },
                    { title: "Assignment" },
                    { title: "Deadline" },
                    { title: "Statistics" },
                ]}
                isLoading={loading}
                onClose={handleModalClose}
                onSubmit={() => onSubmit()}
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                        {/*{filesConfirmed && !imagesAnalyzed && (*/}
                        {/*    <button*/}
                        {/*        type="button"*/}
                        {/*        onClick={handleAnalyzeImages}*/}
                        {/*        disabled={analysisLoading}*/}
                        {/*        className="px-4 py-2 bg-purple-600 text-white rounded-md disabled:opacity-50"*/}
                        {/*    >*/}
                        {/*        {analysisLoading ? "Analyzing images..." : "Analyze images (OCR)"}*/}
                        {/*    </button>*/}
                        {/*)}*/}

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
                                    label: tariff.category_name,
                                    description: `${tariff.price_per_word} USD/word`,
                                }))}
                                renderOption={(option) => (
                                    <div className="flex items-center justify-between w-full">
                                        <span>{option.label}</span>
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
                            <div className="flex flex-wrap items-center justify-between gap-2">
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
                                translators={translators}
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
                                        setTranslatorTrafficId(String(selectedTranslator.traffic[0].id))
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
                                            Залишіть порожнім для стандартної знижки клієнта ({defaultDiscountPercent}%)
                                        </span>
                                    </div>
                                </div>

                                {/* Чекбокс ручної ціни */}
                                <div className="rounded-xl border p-4 space-y-3">
                                    <label className="flex items-center gap-3 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={useManualPrice}
                                            onChange={(e) => {
                                                setUseManualPrice(e.target.checked)
                                                // Якщо вимкнули ручну ціну, одразу повертаємо авто-ціну
                                                if (!e.target.checked) setTotalAmount(String(discountedAutoPrice))
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
                                        </div>
                                    )}

                                    <div className="pl-7 text-sm text-gray-500">
                                        Фінальна ціна:{" "}
                                        <span className="font-semibold text-gray-800">{effectivePrice}</span>
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

                                        {/* 🔥 ОНОВЛЕНО: Відображення авто-ціни та АКТИВНОЇ знижки */}
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Базова авто-ціна:</span>
                                            <span className="font-medium">{priceData.total_client_price}</span>
                                        </div>
                                        {activeDiscount > 0 && (
                                            <div className="flex justify-between text-blue-600 mt-1">
                                                <span className="font-medium">
                                                    Знижка ({customDiscount !== "" ? "Ручна" : "Клієнта"} {activeDiscount}%):
                                                </span>
                                                <span className="font-bold">
                                                    -{ (baseAutoPrice * (activeDiscount / 100)).toFixed(2) }
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between border-t border-green-200 pt-2 mt-2">
                                            <span className="text-gray-800 font-semibold">Ціна до сплати:</span>
                                            <span className="font-bold text-green-700">{discountedAutoPrice}</span>
                                        </div>

                                        {priceData.translator_rate_per_page && (
                                            <>
                                                <div className="flex justify-between mt-4">
                                                    <span className="text-gray-600">Вартість перекладача:</span>
                                                    <span className="font-medium">{priceData.translator_total}</span>
                                                </div>
                                                <div className="flex justify-between border-t border-green-200 pt-2 mt-1">
                                                    <span className="text-gray-600">Маржа:</span>
                                                    <span className="font-semibold text-green-700">{priceData.margin}</span>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            type="number"
                            min="0"
                            placeholder="Work type"
                            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            onKeyDown={(e) => {
                                if (["-", "e", "E", "+"].includes(e.key)) {
                                    e.preventDefault();
                                }
                            }}
                            onFocus={(e) => e.target.select()}
                            value={form.work_type === 0 ? "" : form.work_type}
                            onChange={(e) => {
                                const val = e.target.value;
                                const numericValue = val === "" ? 0 : Math.max(0, parseInt(val, 10));
                                setForm(prev => ({ ...prev, work_type: numericValue }))
                            }}
                        />
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