"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Select, SelectItem } from "@/src/components/ui/select"
import { useOrders } from "@/src/features/orders/hooks/useOrders"
import { useState } from "react"
import { SelectContent, SelectTrigger, SelectValue } from "@radix-ui/react-select"
import { TranslatorSelect } from "@/src/features/orders/components/TranslatorSelect"
import { OrdersTable } from "@/src/features/orders/components/OrdersBlock"
import {DashboardHeader} from "@/src/shared/components/layout/DashboardHeader";

export default function CreateOrderPage() {
    const {
        createOrder,
        loading,
        translators,
        selectedTranslatorId,
        setSelectedTranslatorId,
        orders,
        loadOrderDetails,
        loadLanguagePair,
        languagePairs,
        translatorsCache
    } = useOrders()

    /**
     * ⛔ Локальний state дозволений
     * ✔ лише для UI-форм (input/select)
     * ✔ НЕ бізнес-логіка
     */
    const [clientId, setClientId] = useState("")
    const [translatorId, setTranslatorId] = useState<number | null>(null)
    const [sourceLanguage, setSourceLanguage] = useState("")
    const [targetLanguage, setTargetLanguage] = useState("")
    const [languagePair, setLanguagePair] = useState("")
    const [translatorTrafficId, setTranslatorTrafficId] = useState("")
    const [trafficId, setTrafficId] = useState("")
    const [currencyId, setCurrencyId] = useState("")
    const [files, setFiles] = useState<File[]>([])

    const onSubmit = async () => {
        await createOrder({
            client_id: Number(clientId),
            source_language: Number(sourceLanguage),
            target_language: Number(targetLanguage),
            traffic_id: Number(trafficId),
            translator_traffic_id: Number(translatorTrafficId),
            currency_id_id: Number(currencyId),
            language_pair_id: Number(languagePair),
            translator_id: selectedTranslatorId ?? undefined,
            files,
        })
    }

    return (
        <>
            <DashboardHeader/>
            <div className="space-y-8">
                {/* ---------- CREATE ORDER FORM ---------- */}
                <Card className="max-w-xl mx-auto">
                    <CardHeader>
                        <CardTitle>Create order</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <Input
                            placeholder="Client ID"
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                        />

                        <Input
                            placeholder="Source language ID"
                            value={sourceLanguage}
                            onChange={(e) => setSourceLanguage(e.target.value)}
                        />

                        <Input
                            placeholder="Target language ID"
                            value={targetLanguage}
                            onChange={(e) => setTargetLanguage(e.target.value)}
                        />

                        <Input
                            placeholder="Traffic ID"
                            value={trafficId}
                            onChange={(e) => setTrafficId(e.target.value)}
                        />

                        <Input
                            placeholder="Language pair"
                            value={languagePair}
                            onChange={(e) => setLanguagePair(e.target.value)}
                        />

                        <Input
                            placeholder="Traffic translator"
                            value={translatorTrafficId}
                            onChange={(e) =>
                                setTranslatorTrafficId(e.target.value)
                            }
                        />

                        <Input
                            placeholder="Currency"
                            value={currencyId}
                            onChange={(e) => setCurrencyId(e.target.value)}
                        />

                        {/* ---------- TRANSLATOR SELECT ---------- */}
                        <TranslatorSelect
                            translators={translators}
                            value={translatorId}
                            onChange={setSelectedTranslatorId}
                        />

                        {/* ---------- FILES ---------- */}
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
                        />

                        <Button
                            disabled={loading}
                            onClick={onSubmit}
                            className="w-full"
                        >
                            {loading ? "Creating..." : "Create order"}
                        </Button>
                    </CardContent>
                </Card>

                {/* ---------- ORDERS BLOCK (ADDED) ---------- */}
                <OrdersTable
                    orders={orders}
                    onOpen={loadOrderDetails}
                    languagePairs={languagePairs}
                    translatorsCache={translatorsCache}
                />
            </div>
        </>
    )
}
