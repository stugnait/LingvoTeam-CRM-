"use client"

import { useState, useEffect } from "react"
import { WizardModal } from "@/src/components/modals/wizard/WizardModal"
import { WizardStep } from "@/src/components/modals/wizard/WizardStep"
import {
    User,
    Languages,
    Tag,
    Users,
    CalendarClock,
    MessageSquare,
    DollarSign,
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
import { Priority, PrioritySelector } from "@/src/components/ui/PrioritySelector"
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
    onRefreshTranslators?: () => Promise<void>
}

type EditorOption = {
    value: string
    label: string
    description?: string
}

export function CreateOrderModal(props: CreateOrderModalProps) {
    const {
        open,
        onOpenChange,
        onSubmit,
        loading,
        clientId,
        setClientId,
        files,
        mode = "create",
        orderId,
        setFiles,
        sourceLanguage,
        setSourceLanguage,
        targetLanguage,
        setTargetLanguage,
        trafficId,
        setTrafficId,
        currencyId,
        setCurrencyId,
        selectedTranslatorId,
        setSelectedTranslatorId,
        editor,
        setEditor,
        translatorTrafficId,
        setTranslatorTrafficId,
        clients,
        languages,
        editors,
        currencies,
        translators,
        tariffs,
        deadline,
        setDeadline,
        comment,
        setComment,
        priority,
        setPriority,
        onRefreshTranslators,
        managerAccept,
        setManagerAccept,
        managerDelivery,
        setManagerDelivery,
        managers,
    } = props

    const {
        form, setForm, isFormOpen, openAddTranslator, closeModals, submitTranslator
    } = useTranslators()

    const handleQuickCreateTranslator = async () => {
        await submitTranslator(form)
        if (onRefreshTranslators) { await onRefreshTranslators() }
        closeModals()
    }

    const handleModalClose = (open: boolean) => {
        if (!open) {
            resetStats()
            setFilesConfirmed(false)
            setImagesAnalyzed(false)
        }
        onOpenChange(open)
    }

    const {
        calculateStats,
        statsResult,
        statsLoading,
        analyzeOrderFiles,
        analysisResult,
        analysisLoading,
        resetStats
    } = useOrderAnalysis()

    const [filesConfirmed, setFilesConfirmed] = useState(false)
    const [imagesAnalyzed, setImagesAnalyzed] = useState(false)
    const [editorOptions, setEditorOptions] = useState<EditorOption[]>([])
    const [priceCalculated, setPriceCalculated] = useState(false)
    const [priceData, setPriceData] = useState<any>(null)
    const [priceLoading, setPriceLoading] = useState(false)

    // ─── Валідація кроків ────────────────────────────────────────────────────

    const stepValidation = (step: number): boolean => {
        switch (step) {
            case 0:
                return !!clientId && !!sourceLanguage && !!targetLanguage && files.length > 0 && filesConfirmed
            case 1:
                return !!trafficId && !!currencyId
            case 2:
                return !!selectedTranslatorId && !!editor && !!managerAccept && !!managerDelivery
            case 3:
                return !!deadline && !!priority
            default:
                return true
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
            default:
                return null
        }
    }

    // ─── Handlers ───────────────────────────────────────────────────────────

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
            if (selectedTranslatorId) {
                formData.append("translator_id", String(selectedTranslatorId))
            }
            if (translatorTrafficId) {
                formData.append("translator_traffic_id", translatorTrafficId)
            }
            const res = await ordersApi.previewPrice(formData)
            setPriceData(res)
            setPriceCalculated(true)
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
            setEditorOptions(
                editors.map((ed) => ({ value: String(ed.id), label: ed.full_name }))
            )
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
                setEditorOptions(
                    editors.map((ed) => ({ value: String(ed.id), label: ed.full_name }))
                )
            })

        return () => { cancelled = true }
    }, [sourceLanguage, targetLanguage, editors])

    useEffect(() => {
        if (!filesConfirmed) return
        if (!trafficId) return
        if (!files.length) return
        handleCalculatePrice()
    }, [filesConfirmed, trafficId, selectedTranslatorId])

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
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Combobox
                                value={sourceLanguage}
                                onChange={setSourceLanguage}
                                placeholder="Source language"
                                options={languages.map((l) => ({
                                    value: String(l.id),
                                    label: l.name,
                                }))}
                            />
                            <Combobox
                                value={targetLanguage}
                                onChange={setTargetLanguage}
                                placeholder="Target language"
                                options={languages.map((l) => ({
                                    value: String(l.id),
                                    label: l.name,
                                }))}
                            />
                        </div>

                        <FileUpload
                            files={files}
                            onFilesChange={(f) => {
                                setFiles(f)
                                setFilesConfirmed(false)
                                setImagesAnalyzed(false)
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

                        {statsResult && (
                            <div className="bg-gray-100 p-4 rounded-lg text-sm">
                                <p>Pages: {statsResult.total_stats.physical_pages}</p>
                                <p>Chars (with spaces): {statsResult.total_stats.chars_with_spaces}</p>
                                <p>Images: {statsResult.total_stats.images}</p>
                            </div>
                        )}

                        {filesConfirmed && !imagesAnalyzed && (
                            <button
                                type="button"
                                onClick={handleAnalyzeImages}
                                disabled={analysisLoading}
                                className="px-4 py-2 bg-purple-600 text-white rounded-md disabled:opacity-50"
                            >
                                {analysisLoading ? "Analyzing images..." : "Analyze images (OCR)"}
                            </button>
                        )}

                        {analysisResult && (
                            <div className="bg-purple-50 p-4 rounded-lg text-sm">
                                <p className="text-purple-700 font-medium">OCR completed successfully</p>
                                {analysisResult.total_words && (
                                    <p>Total words detected: {analysisResult.total_words}</p>
                                )}
                                <p>Total images found: {analysisResult.total_images_found}</p>
                                <p>Total detected symbols: {analysisResult.total_detected_symbols_from_images}</p>
                                <div className="mt-3 space-y-2">
                                    {analysisResult.results?.map((r, idx) => (
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
                            <div className="text-green-600 text-sm font-medium">Images analysis completed</div>
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
                                translators={translators}
                                sourceLanguage={sourceLanguage}
                                targetLanguage={targetLanguage}
                                placeholder="Select translator (optional)"
                                orderTrafficId={trafficId ? Number(trafficId) : null}
                                onChange={(translatorId, translatorTrafficId) => {
                                    setSelectedTranslatorId(translatorId)
                                    setTranslatorTrafficId(translatorTrafficId ? String(translatorTrafficId) : "")
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
                                options={managers.map((m) => ({
                                    value: String(m.id),
                                    label: m.full_name,
                                }))}
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
                                options={managers.map((m) => ({
                                    value: String(m.id),
                                    label: m.full_name,
                                }))}
                            />
                        </div>

                        {selectedTranslatorId && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Translator Traffic ID
                                </label>
                                <input
                                    type="text"
                                    value={translatorTrafficId}
                                    onChange={(e) => setTranslatorTrafficId(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                />
                            </div>
                        )}
                    </div>

                    {priceLoading && (
                        <div className="text-sm text-gray-500 mt-4">Calculating price...</div>
                    )}

                    {priceData && !priceLoading && (
                        <div className="bg-green-50 p-4 rounded-lg text-sm space-y-1 mt-4">
                            <p className="font-medium text-green-700">Price Preview</p>
                            <p>Pages: {priceData.pages}</p>
                            <p>Client price: {priceData.total_client_price}</p>
                            {priceData.translator_rate_per_page && (
                                <>
                                    <p>Translator: {priceData.translator_total}</p>
                                    <p>Margin: {priceData.margin}</p>
                                </>
                            )}
                        </div>
                    )}
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
                    <Input
                        placeholder="Phone"
                        value={form.phone}
                        onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            placeholder="Work type"
                            value={form.work_type}
                            onChange={(e) => setForm(prev => ({ ...prev, work_type: Number(e.target.value) }))}
                        />
                        <Input
                            placeholder="Currency ID"
                            type="number"
                            value={form.currency_id}
                            onChange={(e) => setForm(prev => ({ ...prev, currency_id: Number(e.target.value) }))}
                        />
                    </div>
                </div>
            </BaseFormModal>
        </>
    )
}