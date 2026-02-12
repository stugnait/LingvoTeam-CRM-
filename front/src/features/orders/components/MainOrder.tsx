"use client"

import { Button } from "@/src/components/ui/button"
import { useOrders } from "@/src/features/orders/hooks/useOrders"
import { useEffect, useState } from "react"
import { OrdersTable } from "@/src/features/orders/components/OrdersBlock"
import { Plus } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { CreateOrderModal } from "./CreateOrderForm"

export default function CreateOrderPage() {
    const {
        createOrder,
        loading,
        orders,
        loadOrderDetails,
        languagePairs,
        translatorsCache,
        // Дані з хука
        clients,
        languages,
        editors,
        trafficTypes,
        currencyList,
        translators
    } = useOrders()

    // State for modal
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Form states
    const [clientId, setClientId] = useState<string>("")
    const [sourceLanguage, setSourceLanguage] = useState<string>("")
    const [targetLanguage, setTargetLanguage] = useState<string>("")
    const [editor, setEditor] = useState<string>("")
    const [trafficId, setTrafficId] = useState<string>("")
    const [languagePairId, setLanguagePairId] = useState<string>("")
    const [translatorTrafficId, setTranslatorTrafficId] = useState<string>("")
    const [currencyId, setCurrencyId] = useState<string>("")
    const [selectedTranslatorId, setSelectedTranslatorId] = useState<number | null>(null)
    const [files, setFiles] = useState<File[]>([])

    const searchParams = useSearchParams()
    const highlightId = Number(searchParams.get("highlight"))
    const [activeHighlightId, setActiveHighlightId] = useState<number | null>(null)
    const router = useRouter()

    useEffect(() => {
        if (!highlightId) return
        setActiveHighlightId(highlightId)
        const timer = setTimeout(() => {
            setActiveHighlightId(null)
            router.replace("/dashboard/orders", { scroll: false })
        }, 5000)
        return () => clearTimeout(timer)
    }, [highlightId, router])

    const handleSubmit = async () => {
        await createOrder({
            client_id: Number(clientId),
            source_language: Number(sourceLanguage),
            target_language: Number(targetLanguage),
            traffic_id: Number(trafficId),
            translator_traffic_id: Number(translatorTrafficId),
            currency_id_id: Number(currencyId),
            language_pair_id: Number(languagePairId),
            editor_id: Number(editor),
            translator_id: selectedTranslatorId ?? undefined,
            files,
        })

        // Reset form
        setClientId("")
        setSourceLanguage("")
        setTargetLanguage("")
        setLanguagePairId("")
        setTranslatorTrafficId("")
        setTrafficId("")
        setEditor("")
        setCurrencyId("")
        setSelectedTranslatorId(null)
        setFiles([])
        setIsModalOpen(false)
    }

    return (
        <>
            <div className="fixed bottom-8 right-8 z-40">
                <Button
                    onClick={() => setIsModalOpen(true)}
                    className="rounded-full w-14 h-14 p-0 shadow-lg bg-blue-600 hover:bg-blue-700 text-white transition-all hover:scale-110 active:scale-95"
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </div>

            <div className="space-y-8">
                <OrdersTable
                    orders={orders}
                    onOpen={loadOrderDetails}
                    languagePairs={languagePairs}
                    translatorsCache={translatorsCache}
                    highlightId={activeHighlightId}
                />
            </div>

            <CreateOrderModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSubmit={handleSubmit}
                loading={loading}
                // Form states
                clientId={clientId}
                setClientId={setClientId}
                sourceLanguage={sourceLanguage}
                setSourceLanguage={setSourceLanguage}
                targetLanguage={targetLanguage}
                setTargetLanguage={setTargetLanguage}
                editor={editor}
                setEditor={setEditor}
                trafficId={trafficId}
                setTrafficId={setTrafficId}
                languagePairId={languagePairId}
                setLanguagePairId={setLanguagePairId}
                translatorTrafficId={translatorTrafficId}
                setTranslatorTrafficId={setTranslatorTrafficId}
                currencyId={currencyId}
                setCurrencyId={setCurrencyId}
                selectedTranslatorId={selectedTranslatorId}
                setSelectedTranslatorId={setSelectedTranslatorId}
                files={files}
                setFiles={setFiles}
                // Data from hooks
                clients={clients || []}
                languages={languages || []}
                editors={editors || []}
                trafficTypes={trafficTypes || []}
                languagePairs={languagePairs || []}
                currencies={currencyList || []}
                translators={translators || []}
            />
        </>
    )
}