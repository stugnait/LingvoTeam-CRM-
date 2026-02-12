"use client"

import { SideModal } from "@/src/components/modals/SideModal"
import { User, Globe, Languages, Edit, Hash, Repeat, DollarSign } from "lucide-react"
import { CustomSelect } from "@/src/components/ui/CustomSelect"
import { TranslatorSelect } from "@/src/components/ui/TranslatorSelect"
import { FileUpload } from "@/src/components/ui/FileUpload"
import { TranslatorTrafficIdField } from "@/src/components/ui/TranslatorTrafficIdField"

interface CreateOrderModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: () => void
    loading: boolean

    // Form states
    clientId: string
    setClientId: (value: string) => void
    sourceLanguage: string
    setSourceLanguage: (value: string) => void
    targetLanguage: string
    setTargetLanguage: (value: string) => void
    editor: string
    setEditor: (value: string) => void
    trafficId: string
    setTrafficId: (value: string) => void
    languagePairId: string
    setLanguagePairId: (value: string) => void
    translatorTrafficId: string
    setTranslatorTrafficId: (value: string) => void
    currencyId: string
    setCurrencyId: (value: string) => void
    selectedTranslatorId: number | null
    setSelectedTranslatorId: (id: number | null) => void
    files: File[]
    setFiles: (files: File[]) => void

    // Data props
    clients: any[]
    languages: any[]
    editors: any[]
    trafficTypes: any[]
    languagePairs: any[]
    currencies: any[]
    translators: any[]
}

export function CreateOrderModal({
                                     open,
                                     onOpenChange,
                                     onSubmit,
                                     loading,
                                     // Form states
                                     clientId,
                                     setClientId,
                                     sourceLanguage,
                                     setSourceLanguage,
                                     targetLanguage,
                                     setTargetLanguage,
                                     editor,
                                     setEditor,
                                     trafficId,
                                     setTrafficId,
                                     languagePairId,
                                     setLanguagePairId,
                                     translatorTrafficId,
                                     setTranslatorTrafficId,
                                     currencyId,
                                     setCurrencyId,
                                     selectedTranslatorId,
                                     setSelectedTranslatorId,
                                     files,
                                     setFiles,
                                     // Data
                                     clients,
                                     languages,
                                     editors,
                                     trafficTypes,
                                     languagePairs,
                                     currencies,
                                     translators
                                 }: CreateOrderModalProps) {
    return (
        <SideModal
            open={open}
            onOpenChange={onOpenChange}
            title="Create New Order"
            submitLabel="Create Order"
            cancelLabel="Cancel"
            isLoading={loading}
            onSubmit={onSubmit}
        >
            <div className="space-y-4">
                {/* Client Select */}
                <CustomSelect
                    label="Client"
                    icon={User}
                    options={clients}
                    value={clientId}
                    onChange={setClientId}
                    placeholder="Select client"
                    showId={true}
                    renderOption={(client) => (
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-medium text-xs">
                                {client.name?.charAt(0) || '?'}
                            </div>
                            <div>
                                <div className="text-sm font-medium">{client.name}</div>
                                <div className="text-xs text-gray-500">{client.email} • {client.country}</div>
                            </div>
                        </div>
                    )}
                    renderValue={(client) => (
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-medium text-xs">
                                {client.name?.charAt(0) || '?'}
                            </div>
                            <div>
                                <div className="text-sm font-medium">{client.name}</div>
                                <div className="text-xs text-gray-500">ID: {client.id}</div>
                            </div>
                        </div>
                    )}
                />

                {/* Source Language Select */}
                <CustomSelect
                    label="Source Language"
                    icon={Globe}
                    options={languages}
                    value={sourceLanguage}
                    onChange={setSourceLanguage}
                    placeholder="Select source language"
                    showId={true}
                    searchable={true}
                    renderOption={(lang) => (
                        <span className="flex items-center gap-2">
                            {lang.flag && <span>{lang.flag}</span>}
                            <span>{lang.name}</span>
                            {lang.native && <span className="text-xs text-gray-500">({lang.native})</span>}
                        </span>
                    )}
                />

                {/* Target Language Select */}
                <CustomSelect
                    label="Target Language"
                    icon={Languages}
                    options={languages}
                    value={targetLanguage}
                    onChange={setTargetLanguage}
                    placeholder="Select target language"
                    showId={true}
                    searchable={true}
                    renderOption={(lang) => (
                        <span className="flex items-center gap-2">
                            {lang.flag && <span>{lang.flag}</span>}
                            <span>{lang.name}</span>
                            {lang.native && <span className="text-xs text-gray-500">({lang.native})</span>}
                        </span>
                    )}
                />

                {/* Editor Select */}
                <CustomSelect
                    label="Editor"
                    icon={Edit}
                    options={editors}
                    value={editor}
                    onChange={setEditor}
                    placeholder="Select editor"
                    showId={true}
                    renderOption={(editor) => (
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-400 font-medium text-xs">
                                {editor.name?.charAt(0) || '?'}
                            </div>
                            <div>
                                <div className="text-sm font-medium">{editor.name}</div>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <span>ID: {editor.trafficId}</span>
                                    {editor.rating && (
                                        <>
                                            <span>•</span>
                                            <span>⭐ {editor.rating}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                />

                {/* Traffic Type Select */}
                <CustomSelect
                    label="Traffic Type"
                    icon={Hash}
                    options={trafficTypes}
                    value={trafficId}
                    onChange={setTrafficId}
                    placeholder="Select traffic type"
                    showId={true}
                    renderOption={(traffic) => (
                        <div>
                            <div className="text-sm font-medium">{traffic.name}</div>
                            <div className="text-xs text-gray-500">
                                {traffic.code} {traffic.department && `• ${traffic.department}`}
                            </div>
                        </div>
                    )}
                />

                {/* Language Pair Select */}
                <CustomSelect
                    label="Language Pair"
                    icon={Repeat}
                    options={languagePairs}
                    value={languagePairId}
                    onChange={setLanguagePairId}
                    placeholder="Select language pair"
                    showId={true}
                    renderOption={(pair) => (
                        <span className="flex items-center gap-2">
                            {pair.sourceFlag && <span>{pair.sourceFlag}</span>}
                            <span>→</span>
                            {pair.targetFlag && <span>{pair.targetFlag}</span>}
                            <span className="text-sm ml-1">{pair.name}</span>
                        </span>
                    )}
                    renderValue={(pair) => (
                        <span className="flex items-center gap-2">
                            {pair.sourceFlag && <span>{pair.sourceFlag}</span>}
                            <span>→</span>
                            {pair.targetFlag && <span>{pair.targetFlag}</span>}
                            <span className="text-sm ml-1">{pair.name}</span>
                        </span>
                    )}
                />

                {/* Translator Traffic ID - Read Only */}
                <TranslatorTrafficIdField value={translatorTrafficId} />



                {/* Currency Select */}
                <CustomSelect
                    label="Currency"
                    icon={DollarSign}
                    options={currencies}
                    value={currencyId}
                    onChange={setCurrencyId}
                    placeholder="Select currency"
                    showId={true}
                    renderOption={(currency) => (
                        <span className="flex items-center gap-2">
                            <span className="font-medium">{currency.symbol}</span>
                            <span>{currency.code}</span>
                            <span className="text-xs text-gray-500">- {currency.name}</span>
                            {currency.rate && <span className="text-xs text-gray-400">(rate: {currency.rate})</span>}
                        </span>
                    )}
                />

                {/* Translator Select */}
                <TranslatorSelect
                    translators={translators}
                    value={selectedTranslatorId}
                    onChange={(translatorId, translatorTrafficId) => {
                        setSelectedTranslatorId(translatorId)
                        setTranslatorTrafficId(String(translatorTrafficId))
                    }}
                    orderTrafficId={trafficId ? Number(trafficId) : null}
                />

                {/* File Upload */}
                <FileUpload files={files} onFilesChange={setFiles} />
            </div>
        </SideModal>
    )
}