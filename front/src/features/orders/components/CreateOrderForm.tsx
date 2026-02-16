"use client"

import { WizardModal } from "@/src/components/modals/wizard/WizardModal"
import { WizardStep } from "@/src/components/modals/wizard/WizardStep"

import {
    User,
    Globe,
    Languages,
    Edit,
    DollarSign,
    Check
} from "lucide-react"

import { Combobox } from "@/src/components/ui/Combobox"
import { TranslatorSelect } from "@/src/components/ui/TranslatorSelect"
import { FileUpload } from "@/src/components/ui/FileUpload"
import { TranslatorTrafficIdField } from "@/src/components/ui/TranslatorTrafficIdField"
import { LanguageSelectorCard } from "@/src/components/ui/LanguageSelectorCard"
import { SwapButton } from "@/src/components/ui/SwapButton"
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem
} from "@/src/components/ui/select"

interface CreateOrderModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: () => void
    loading: boolean

    clientId: string
    setClientId: (value: string) => void

    sourceLanguage: string
    setSourceLanguage: (value: string) => void

    targetLanguage: string
    setTargetLanguage: (value: string) => void

    editor: string
    setEditor: (value: string) => void

    trafficId: string
    language: string
    setLanguage: (value: string) => void

    translatorTrafficId: string
    setTranslatorTrafficId: (value: string) => void

    currencyId: string
    setCurrencyId: (value: string) => void

    selectedTranslatorId: number | null
    setSelectedTranslatorId: (id: number | null) => void

    files: File[]
    setFiles: (files: File[]) => void

    clients: any[]
    languages: any[]
    editors: any[]
    currencies: any[]
    translators: any[]
}

export function CreateOrderModal(props: CreateOrderModalProps) {

    const {
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
        currencies,
        translators,
    } = props

    return (
        <WizardModal
            open={open}
            onOpenChange={onOpenChange}
            title="Create New Order"
            steps={[
                { title: "Languages" },
                { title: "Assignment" },
                { title: "Files" },
            ]}
            isLoading={loading}
            submitLabel="Create Order"
            onSubmit={onSubmit}
        >

            {/* STEP 1 — LANGUAGES */}
            <WizardStep>
                <div className="space-y-4">

                    {/* Client */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-medium">
                            <User className="h-3.5 w-3.5 text-blue-600" />
                            Client
                        </label>

                        <Combobox
                            value={clientId}
                            onChange={setClientId}
                            placeholder="Select client"
                            searchPlaceholder="Search client..."
                            options={clients.map(client => ({
                                value: String(client.id),
                                label: client.full_name,
                            }))}
                        />
                    </div>

                    {/* Source Language */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-medium">
                            <Globe className="h-3.5 w-3.5 text-blue-600" />
                            Source Language
                        </label>

                        <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select source language" />
                            </SelectTrigger>
                            <SelectContent searchable>
                                {languages.map(lang => (
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

                        <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select target language" />
                            </SelectTrigger>
                            <SelectContent searchable>
                                {languages.map(lang => (
                                    <SelectItem key={lang.id} value={String(lang.id)}>
                                        {lang.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </WizardStep>

            {/* STEP 2 — ASSIGNMENT */}
            <WizardStep>
                <div className="space-y-10">

                    <div className="text-center">
                        <h2 className="text-2xl font-semibold">
                            Select Languages
                        </h2>
                        <p className="text-muted-foreground text-sm mt-2">
                            Choose source and target language
                        </p>
                    </div>

                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">

                        <LanguageSelectorCard
                            label="Source Language"
                            value={sourceLanguage}
                            onChange={setSourceLanguage}
                            languages={languages}
                        />

                        <SwapButton
                            source={sourceLanguage}
                            target={targetLanguage}
                            setSource={setSourceLanguage}
                            setTarget={setTargetLanguage}
                        />

                        <LanguageSelectorCard
                            label="Target Language"
                            value={targetLanguage}
                            onChange={setTargetLanguage}
                            languages={languages}
                        />

                    </div>

                </div>
            </WizardStep>



            {/* STEP 3 — FILES */}
            <WizardStep>
                <div className="space-y-4">
                    <FileUpload
                        files={files}
                        onFilesChange={setFiles}
                    />
                </div>
            </WizardStep>

        </WizardModal>
    )
}
