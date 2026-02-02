"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { useOrders } from "@/src/features/orders/hooks/useOrders"
import { useEffect, useMemo, useState } from "react"
import { TranslatorSelect } from "@/src/features/orders/components/TranslatorSelect"
import { OrdersTable } from "@/src/features/orders/components/OrdersBlock"
import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"
import { Plus } from "lucide-react"
import { SideModal } from "@/src/components/modals/SideModal"

// 🔴 NEW: беремо API з твого api.ts
import { getOrderTraffic, getTranslatorTraffic } from "@/src/features/orders/api"

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

    // =====================================================
    // 🔴 NEW: стейт для маржинальності
    // =====================================================
    const [clientRate, setClientRate] = useState<number | null>(null)
    const [translatorRate, setTranslatorRate] = useState<number | null>(null)
    const [translatorIdFromTraffic, setTranslatorIdFromTraffic] = useState<number | null>(null)

    // =====================================================
    // 🔴 NEW: тягнемо client price_per_page по trafficId
    // =====================================================
    useEffect(() => {
        const id = Number(trafficId)
        if (!id) {
            setClientRate(null)
            return
        }

        getOrderTraffic(id)
            .then((res) => {
                setClientRate(Number(res.price_per_page))
            })
            .catch(() => {
                setClientRate(null)
            })
    }, [trafficId])

    // =====================================================
    // 🔴 NEW: тягнемо translator rate_per_page по translatorTrafficId
    // =====================================================
    useEffect(() => {
        const id = Number(translatorTrafficId)
        if (!id) {
            setTranslatorRate(null)
            setTranslatorIdFromTraffic(null)
            return
        }

        getTranslatorTraffic(id)
            .then((res) => {
                setTranslatorRate(Number(res.rate_per_page))
                setTranslatorIdFromTraffic(res.translator_id)
            })
            .catch(() => {
                setTranslatorRate(null)
                setTranslatorIdFromTraffic(null)
            })
    }, [translatorTrafficId])

    // =====================================================
    // 🔴 NEW: рахуємо маржинальність (frontend)
    // margin% = (clientRate - translatorRate) / clientRate * 100
    // =====================================================
    const marginality = useMemo(() => {
        if (
            !clientRate ||
            clientRate <= 0 ||
            !translatorRate ||
            !translatorIdFromTraffic
        ) {
            return {}
        }

        return {
            [translatorIdFromTraffic]:
                ((clientRate - translatorRate) / clientRate) * 100,
        } as Record<number, number>
    }, [clientRate, translatorRate, translatorIdFromTraffic])

    // =====================================================
    // Submit
    // =====================================================
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

        // Reset form and close modal
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
                <OrdersTable
                    orders={orders}
                    onOpen={loadOrderDetails}
                    languagePairs={languagePairs}
                    translatorsCache={translatorsCache}
                />
            </div>

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

                    {/* inputs без змін */}
                    <Input placeholder="Client ID" value={clientId} onChange={(e) => setClientId(e.target.value)} />
                    <Input placeholder="Source Language ID" value={sourceLanguage} onChange={(e) => setSourceLanguage(e.target.value)} />
                    <Input placeholder="Target Language ID" value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} />
                    <Input placeholder="Editor ID" value={editor} onChange={(e) => setEditor(e.target.value)} />
                    <Input placeholder="Traffic ID" value={trafficId} onChange={(e) => setTrafficId(e.target.value)} />
                    <Input placeholder="Language Pair ID" value={languagePair} onChange={(e) => setLanguagePair(e.target.value)} />
                    <Input placeholder="Translator Traffic ID" value={translatorTrafficId} onChange={(e) => setTranslatorTrafficId(e.target.value)} />
                    <Input placeholder="Currency ID" value={currencyId} onChange={(e) => setCurrencyId(e.target.value)} />

                    {/* Translator Select */}
                    <TranslatorSelect
                        translators={translators}
                        value={selectedTranslatorId}
                        onChange={setSelectedTranslatorId}
                        marginality={marginality} // 🔴 NEW
                    />

                    {/* Files */}
                    <Input
                        type="file"
                        multiple
                        onChange={(e) =>
                            setFiles(e.target.files ? Array.from(e.target.files) : [])
                        }
                    />
                </div>
            </SideModal>
        </>
    )
}
