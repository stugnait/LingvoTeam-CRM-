"use client"

import { Button } from "@/src/components/ui/button"
import { useOrders } from "@/src/features/orders/hooks/useOrders"
import { useEffect, useState } from "react"
import { OrdersTable } from "@/src/features/orders/components/OrdersBlock"
import { Plus } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { CreateOrderModal } from "./CreateOrderForm"
import {DashboardHeader} from "@/src/shared/components/layout/DashboardHeader";
import {Priority} from "@/src/components/ui/PrioritySelector";

export default function CreateOrderPage() {
    const {
        createOrder,
        loading,
        orders,
        loadOrderDetails,
        languagePairs,
        translatorsCache,
        clients,
        languages,
        editors,
        currencies,
        translators
    } = useOrders()

    // State for modal
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Form states
    const [clientId, setClientId] = useState<string>("")
    const [sourceLanguage, setSourceLanguage] = useState<string>("")
    const [targetLanguage, setTargetLanguage] = useState<string>("")
    const [language, setLanguage] = useState<string>("")
    const [editor, setEditor] = useState<string>("")
    const [trafficId, setTrafficId] = useState<string>("")
    const [languagePairId, setLanguagePairId] = useState<string>("")
    const [translatorTrafficId, setTranslatorTrafficId] = useState<string>("")
    const [currencyId, setCurrencyId] = useState<string>("")
    const [selectedTranslatorId, setSelectedTranslatorId] = useState<number | null>(null)
    const [files, setFiles] = useState<File[]>([])

    // Нові стани для 4-го кроку
    const [deadline, setDeadline] = useState<Date | undefined>(undefined)  // ✅ змінено з deadlines на deadline
    const [comment, setComment] = useState<string>("")  // ✅ додано comment
    const [priority, setPriority] = useState<Priority | undefined>(undefined)  // ✅ змінено з null на undefined

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
            deadline: deadline?.toISOString(), // ✅ додаємо deadline
            priority, // ✅ додаємо priority
            comment, // ✅ додаємо comment
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
        setDeadline(undefined)  // ✅ скидаємо deadline
        setComment("")  // ✅ скидаємо comment
        setPriority(undefined)  // ✅ скидаємо priority
        setIsModalOpen(false)
    }

    return (
        <>
            <DashboardHeader />
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
                // Step 1
                clientId={clientId}
                setClientId={setClientId}
                sourceLanguage={sourceLanguage}
                setSourceLanguage={setSourceLanguage}
                targetLanguage={targetLanguage}
                setTargetLanguage={setTargetLanguage}
                files={files}
                setFiles={setFiles}
                // Step 2
                trafficId={trafficId}
                setTrafficId={setTrafficId}
                currencyId={currencyId}
                setCurrencyId={setCurrencyId}
                language={language}
                setLanguage={setLanguage}
                // Step 3
                selectedTranslatorId={selectedTranslatorId}
                setSelectedTranslatorId={setSelectedTranslatorId}
                editor={editor}
                setEditor={setEditor}
                translatorTrafficId={translatorTrafficId}
                setTranslatorTrafficId={setTranslatorTrafficId}
                // Step 4 - ✅ виправлено назви
                deadline={deadline}
                setDeadline={setDeadline}
                comment={comment}
                setComment={setComment}
                priority={priority}
                setPriority={setPriority}
                // Data
                clients={clients || []}
                languages={languages || []}
                editors={editors || []}
                currencies={currencies || []}
                translators={translators || []}
                tariffs={[]} // Потрібно буде додати з useOrders
            />
        </>
    )
}