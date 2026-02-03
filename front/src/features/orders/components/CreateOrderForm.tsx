"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { useOrders } from "@/src/features/orders/hooks/useOrders"
import { useState } from "react"
import { TranslatorSelect } from "@/src/features/orders/components/TranslatorSelect"
import { OrdersTable } from "@/src/features/orders/components/OrdersBlock"
import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"
import { Plus } from "lucide-react"
import { SideModal } from "@/src/components/modals/SideModal" // Імпортуємо нову модалку

export default function CreateOrderPage() {
    const {
        createOrder,
        loading,
        translators,
        selectedTranslatorId,
        setSelectedTranslatorId,
        orders,
        loadOrderDetails,
        languagePairs,
        translatorsCache
    } = useOrders()

    // State for modal
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Form states
    const [clientId, setClientId] = useState("")
    const [sourceLanguage, setSourceLanguage] = useState("")
    const [targetLanguage, setTargetLanguage] = useState("")
    const [languagePair, setLanguagePair] = useState("")
    const [translatorTrafficId, setTranslatorTrafficId] = useState("")
    const [editor, setEditor] = useState("")
    const [trafficId, setTrafficId] = useState("")
    const [currencyId, setCurrencyId] = useState("")
    const [files, setFiles] = useState<File[]>([])

    const handleSubmit = async () => {
        await createOrder({
            client_id: Number(clientId),
            source_language: Number(sourceLanguage),
            target_language: Number(targetLanguage),
            traffic_id: Number(trafficId),
            translator_traffic_id: Number(translatorTrafficId),
            currency_id_id: Number(currencyId),
            language_pair_id: Number(languagePair),
            editor_id: Number(editor),
            translator_id: selectedTranslatorId ?? undefined,
            files,
        })

        // Reset form and close modal after successful submission
        setClientId("")
        setSourceLanguage("")
        setTargetLanguage("")
        setLanguagePair("")
        setTranslatorTrafficId("")
        setTrafficId("")
        setEditor("")
        setCurrencyId("")
        setFiles([])
        setIsModalOpen(false)
    }

    return (
        <>

            {/* Fixed button to open modal */}
            <div className="fixed bottom-8 right-8 z-40">
                <Button
                    onClick={() => setIsModalOpen(true)}
                    className="rounded-full w-14 h-14 p-0 shadow-lg hover-lift"
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </div>

            <div className="space-y-8">
                {/* Orders table */}
                <OrdersTable
                    orders={orders}
                    onOpen={loadOrderDetails}
                    languagePairs={languagePairs}
                    translatorsCache={translatorsCache}
                />
            </div>

            {/* Side modal for creating order */}
            <SideModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                title="Create New Order"
                submitLabel="Create Order"
                cancelLabel="Cancel"
                isLoading={loading}
                onSubmit={handleSubmit}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Client ID
                        </label>
                        <Input
                            placeholder="Enter client ID"
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                            className="transition-smooth focus-visible-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Source Language ID
                        </label>
                        <Input
                            placeholder="Enter source language ID"
                            value={sourceLanguage}
                            onChange={(e) => setSourceLanguage(e.target.value)}
                            className="transition-smooth focus-visible-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Target Language ID
                        </label>
                        <Input
                            placeholder="Enter target language ID"
                            value={targetLanguage}
                            onChange={(e) => setTargetLanguage(e.target.value)}
                            className="transition-smooth focus-visible-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Editor ID
                        </label>
                        <Input
                            placeholder="Enter target language ID"
                            value={editor}
                            onChange={(e) => setEditor(e.target.value)}
                            className="transition-smooth focus-visible-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Traffic ID
                        </label>
                        <Input
                            placeholder="Enter traffic ID"
                            value={trafficId}
                            onChange={(e) => setTrafficId(e.target.value)}
                            className="transition-smooth focus-visible-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Language Pair
                        </label>
                        <Input
                            placeholder="Enter language pair"
                            value={languagePair}
                            onChange={(e) => setLanguagePair(e.target.value)}
                            className="transition-smooth focus-visible-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Translator Traffic ID
                        </label>
                        <Input
                            placeholder="Will be set automatically after selecting translator"
                            value={translatorTrafficId}
                            readOnly
                            className="transition-smooth focus-visible-primary"
                            />

                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Currency ID
                        </label>
                        <Input
                            placeholder="Enter currency ID"
                            value={currencyId}
                            onChange={(e) => setCurrencyId(e.target.value)}
                            className="transition-smooth focus-visible-primary"
                        />
                    </div>

                    {/* Translator Select */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Select Translator
                        </label>
                        <TranslatorSelect
                            translators={translators}
                            value={selectedTranslatorId}
                            onChange={(translatorId, translatorTrafficId) => {
                                setSelectedTranslatorId(translatorId)
                                setTranslatorTrafficId(translatorTrafficId ? String(translatorTrafficId) : "")
                            }}
                            orderTrafficId={trafficId ? Number(trafficId) : null}
                            />

                    </div>

                    {/* Files Upload */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Upload Files
                        </label>
                        <Input
                            type="file"
                            multiple
                            onChange={(e) =>
                                setFiles(
                                    e.target.files
                                        ? Array.from(e.target.files)
                                        : []
                                )
                            }
                            className="transition-smooth focus-visible-primary"
                        />
                        {files.length > 0 && (
                            <p className="text-sm text-muted-foreground mt-2">
                                {files.length} file(s) selected
                            </p>
                        )}
                    </div>
                </div>
            </SideModal>
        </>
    )
}