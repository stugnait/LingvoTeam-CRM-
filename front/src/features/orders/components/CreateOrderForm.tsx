"use client"

import { useState, useEffect } from "react"
import { WizardModal } from "@/src/components/modals/wizard/WizardModal"
import { WizardStep } from "@/src/components/modals/wizard/WizardStep"
import {
    User,
    Globe,
    Languages,
    FileText,
    Tag,
    Users,
    CalendarClock,
    MessageSquare,
    DollarSign,
} from "lucide-react"

import { Combobox } from "@/src/components/ui/Combobox"
import { TranslatorSelect } from "@/src/components/ui/TranslatorSelect"
import { FileUpload } from "@/src/components/ui/FileUpload"
import { DeadlineSelector } from "@/src/components/ui/DeadlineSelector"
import { Priority, PrioritySelector } from "@/src/components/ui/PrioritySelector"
import { useOrderAnalysis } from "@/src/features/orders/hooks/useOrderAnalysis"
import {ordersApi} from "@/src/features/orders/api";

interface CreateOrderModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: () => void
    loading: boolean

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

    deadline: Date | undefined
    setDeadline: (date: Date | undefined) => void
    comment: string
    setComment: (value: string) => void
    priority: Priority | undefined
    setPriority: (value: Priority) => void
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
    } = props

    const {
        calculateStats,
        statsResult,
        statsLoading,
        analyzeOrderFiles,
        analysisResult,
        analysisLoading,
    } = useOrderAnalysis()

    const [filesConfirmed, setFilesConfirmed] = useState(false)
    const [imagesAnalyzed, setImagesAnalyzed] = useState(false)

    const handleConfirmFiles = async () => {
        if (!files.length) return
        await calculateStats(files)
        setFilesConfirmed(true)
    }

    const handleAnalyzeImages = async () => {
        if (!files.length) return

        await analyzeOrderFiles(files, sourceLanguage ? Number(sourceLanguage) : undefined)
        setImagesAnalyzed(true)
    }

    useEffect(() => {
        if (!trafficId) return
        const selectedTariff = tariffs?.find((t) => String(t.id) === trafficId)
        if (selectedTariff?.currency_id) {
            setCurrencyId(String(selectedTariff.currency_id))
        }
    }, [trafficId, tariffs, setCurrencyId])

    return (
        <WizardModal
            open={open}
            onOpenChange={onOpenChange}
            title="Create New Order"
            steps={[
                { title: "Client & Files" },
                { title: "Tariff" },
                { title: "Assignment" },
                { title: "Deadline" },
            ]}
            isLoading={loading}
            onSubmit={onSubmit}
        >

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
                            className="px-4 py-2 bg-blue-600 text-white rounded-md"
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
                            className="px-4 py-2 bg-purple-600 text-white rounded-md"
                        >
                            {analysisLoading ? "Analyzing images..." : "Analyze images (OCR)"}
                        </button>
                    )}

                    {analysisResult && (
                        <div className="bg-purple-50 p-4 rounded-lg text-sm">
                            <p className="text-purple-700 font-medium">OCR completed successfully</p>
                            <p>Total images found: {analysisResult.total_images_found}</p>
                            <p>Total detected symbols: {analysisResult.total_detected_symbols_from_images}</p>

                            <div className="mt-3 space-y-2">
                                {analysisResult.results?.map((r, idx) => (
                                    <div key={idx} className="p-2 bg-white rounded border">
                                        <div className="font-medium">
                                            {r.filename} ({r.file_type})
                                        </div>

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

            <WizardStep>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Users className="h-4 w-4 text-blue-600" />
                            Translator
                        </label>

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
                            searchPlaceholder="Search editor..."
                            options={editors.map((ed) => ({
                                value: String(ed.id),
                                label: ed.full_name,
                            }))}
                        />
                    </div>

                    {selectedTranslatorId && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Translator Traffic ID</label>
                            <input
                                type="text"
                                value={translatorTrafficId}
                                onChange={(e) => setTranslatorTrafficId(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                                placeholder="Enter traffic ID"
                            />
                        </div>
                    )}
                </div>
            </WizardStep>

            <WizardStep>
                <div className="space-y-6">
                    <PrioritySelector
                        value={priority}
                        onChange={setPriority}
                        required
                    />

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
                            <p>• Languages: {
                                languages.find(l => String(l.id) === sourceLanguage)?.name || '?'} → {
                                languages.find(l => String(l.id) === targetLanguage)?.name || '?'
                            }</p>
                            <p>• Tariff: {tariffs?.find(t => String(t.id) === trafficId)?.name || 'Not selected'}</p>
                            <p>• Priority: {priority || 'none'}</p>
                            <p>• Deadline: {deadline?.toLocaleDateString() || 'Not set'}</p>
                        </div>
                    </div>
                </div>
            </WizardStep>
        </WizardModal>
    )
}