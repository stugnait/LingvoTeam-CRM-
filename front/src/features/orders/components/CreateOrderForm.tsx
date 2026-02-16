"use client"

import { SideModal } from "@/src/components/modals/SideModal"
import {User, Globe, Languages, Edit, Hash, Repeat, DollarSign, Check} from "lucide-react"
import { CustomSelect } from "@/src/components/ui/CustomSelect"
import { TranslatorSelect } from "@/src/components/ui/TranslatorSelect"
import { FileUpload } from "@/src/components/ui/FileUpload"
import { TranslatorTrafficIdField } from "@/src/components/ui/TranslatorTrafficIdField"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/src/components/ui/select"
import { Combobox } from "@/src/components/ui/Combobox"


interface CreateOrderModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: () => void
    loading: boolean

    // Form state
    clientId: string
    setClientId: (value: string) => void
    sourceLanguage: string
    language: string
    setSourceLanguage: (value: string) => void
    targetLanguage: string
    setTargetLanguage: (value: string) => void
    setLanguage: (value: string) => void
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

    // Data
    clients: any[]
    languages: any[]
    editors: any[]
    languagePairs: any[]
    currencies: any[]
    translators: any[]
}

export function CreateOrderModal({
                                     open,
                                     onOpenChange,
                                     onSubmit,
                                     loading,

                                     clientId,
                                     setClientId,
                                     sourceLanguage,
                                     setSourceLanguage,
                                     targetLanguage,
                                     setTargetLanguage,
                                     editor,
                                     setEditor,
                                     trafficId,
    language,
    setLanguage,
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

                                     clients,
                                     languages,
                                     editors,
                                     languagePairs,
                                     currencies,
                                     translators,
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

                {/* Client */}
                <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium">
                        <User className="h-3.5 w-3.5 text-blue-600" />
                        Client
                    </label>
                    {/* Client */}
                    <Combobox
                        value={clientId}
                        onChange={setClientId}
                        placeholder="Select client"
                        searchPlaceholder="Search client..."
                        options={clients.map(client => ({
                            value: String(client.id),
                            label: client.full_name
                        }))}
                    />

                </div>

                {/* Source Language */}
                <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium">
                        <Globe className="h-3.5 w-3.5 text-blue-600" />
                        Source Language
                    </label>
                    {/* Source Language */}
                    <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select source language" />
                        </SelectTrigger>
                        <SelectContent searchable searchPlaceholder="Search language...">
                            {languages.map((lang) => (
                                <SelectItem key={lang.id} value={String(lang.id)}>
                                    {lang.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Target Language */}
                <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium">
                        <Languages className="h-3.5 w-3.5 text-blue-600" />
                        Target Language
                    </label>
                    {/* Target Language */}
                    <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select target language" />
                        </SelectTrigger>
                        <SelectContent searchable searchPlaceholder="Search language...">
                            {languages.map((lang) => (
                                <SelectItem key={lang.id} value={String(lang.id)}>
                                    {lang.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Editor */}
                <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium">
                        <Edit className="h-3.5 w-3.5 text-blue-600" />
                        Editor
                    </label>
                    {/* Editor */}
                    <Combobox
                        value={editor}
                        onChange={setEditor}
                        searchable
                        options={editors.map(e => ({
                            value: String(e.id),
                            label: e.full_name,
                            searchText: `${e.full_name} ${e.email}`,
                            meta: e
                        }))}
                        renderOption={(option, isSelected) => {
                            const editor = option.meta

                            return (
                                <div className="flex items-center justify-between w-full">
                                    <div>
                                        <div className="font-medium">
                                            {editor.full_name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {editor.email}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                    <span className="text-xs">
                        ⭐ {editor.rating}
                    </span>
                                        {isSelected && <Check className="h-4 w-4" />}
                                    </div>
                                </div>
                            )
                        }}
                    />

                </div>

                {/* Language Pair */}
                {/*<div className="space-y-1.5">*/}
                {/*    <label className="flex items-center gap-1.5 text-xs font-medium">*/}
                {/*        <Repeat className="h-3.5 w-3.5 text-blue-600" />*/}
                {/*        Language Pair*/}
                {/*    </label>*/}
                {/*    <Select value={languagePairId} onValueChange={setLanguagePairId}>*/}
                {/*        <SelectTrigger>*/}
                {/*            <SelectValue placeholder="Select language pair" />*/}
                {/*        </SelectTrigger>*/}
                {/*        <SelectContent>*/}
                {/*            {languagePairs.map((pair) => (*/}
                {/*                <SelectItem key={pair.id} value={String(pair.id)}>*/}
                {/*                    {pair.name}*/}
                {/*                </SelectItem>*/}
                {/*            ))}*/}
                {/*        </SelectContent>*/}
                {/*    </Select>*/}
                {/*</div>*/}

                {/* Currency */}
                <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium">
                        <DollarSign className="h-3.5 w-3.5 text-blue-600" />
                        Currency
                    </label>
                    {/* Currency */}
                    <Select value={currencyId} onValueChange={setCurrencyId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent searchable searchPlaceholder="Search currency...">
                            {currencies.map((currency) => (
                                <SelectItem key={currency.id} value={String(currency.id)}>
                                    {currency.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>



                <TranslatorTrafficIdField value={translatorTrafficId} />

                <TranslatorSelect
                    translators={translators}
                    value={selectedTranslatorId}
                    onChange={(translatorId, translatorTrafficId) => {
                        setSelectedTranslatorId(translatorId)
                        setTranslatorTrafficId(String(translatorTrafficId))
                    }}
                    orderTrafficId={trafficId ? Number(trafficId) : null}
                />

                <FileUpload files={files} onFilesChange={setFiles} />
            </div>
        </SideModal>
    )
}
