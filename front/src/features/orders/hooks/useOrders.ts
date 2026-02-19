"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ordersApi } from "../api"
import type {
    CreateOrderPayload,
    CreateOrderResponse,
    OrderListItem,
    Details,
    LanguagePair,
    Translator,
    Client,
    Language,
    Editor,
    Currency,
    OrderTraffic,
} from "../types"
import { useToast } from "@/src/hooks/use-toast"
import { useRouter } from "next/navigation"

export function useOrders() {
    const { toast } = useToast()
    const router = useRouter()

    /* =========================
       STATE
    ========================= */

    const [loading, setLoading] = useState(false)

    const [orders, setOrders] = useState<OrderListItem[]>([])
    const [order, setOrder] = useState<CreateOrderResponse | null>(null)
    const [orderDetail, setOrderDetails] = useState<Details | null>(null)

    const [translators, setTranslators] = useState<Translator[]>([])
    const [clients, setClients] = useState<Client[]>([])
    const [languages, setLanguages] = useState<Language[]>([])
    const [editors, setEditors] = useState<Editor[]>([])
    const [currencies, setCurrencies] = useState<Currency[]>([])
    const [traffics, setTraffics] = useState<OrderTraffic[]>([])

    const [languagePairs, setLanguagePairs] = useState<Record<number, LanguagePair>>({})
    const [translatorsCache, setTranslatorsCache] = useState<Record<number, Translator>>({})

    const [selectedTranslatorId, setSelectedTranslatorId] = useState<number | null>(null)

    const initialLoadedRef = useRef(false)

    /* =========================
       HELPERS
    ========================= */

    const handleError = (e: any, fallback: string) => {
        toast({
            title: "Error",
            description: e?.detail || fallback,
            variant: "error",
        })
    }




    /* =========================
       CREATE ORDER
    ========================= */

    const createOrder = async (data: CreateOrderPayload) => {
        try {
            setLoading(true)

            const formData = new FormData()

            formData.append("client_id", String(data.client_id))
            formData.append("source_language", String(data.source_language))
            formData.append("target_language", String(data.target_language))
            formData.append("traffic_id", String(data.traffic_id))
            formData.append("currency_id_id", String(data.currency_id_id))
            formData.append("editor_id", String(data.editor_id))

            if (data.translator_id)
                {formData.append("translator_id", String(data.translator_id))}

            if (data.translator_traffic_id)
                {formData.append("translator_traffic_id", String(data.translator_traffic_id))}

            data.files?.forEach(file => {
                formData.append("files", file)
            })

            const res = await ordersApi.create(formData)

            setOrder(res)

            toast({
                title: "Order created",
                description: `Order #${res.order_id} created successfully`,
            })

            router.push(`/orders/${res.order_id}`)
            return res
        } catch (e) {
            handleError(e, "Failed to create order")
            throw e
        } finally {
            setLoading(false)
        }
    }

    /* =========================
       LOAD INITIAL DATA
    ========================= */

    const loadInitialData = useCallback(async () => {
        if (initialLoadedRef.current) {return}

        try {
            setLoading(true)

            const [
                translatorsRes,
                ordersRes,
                clientsRes,
                languagesRes,
                editorsRes,
                currencyRes,
                orderTrafficRes,
            ] = await Promise.all([
                ordersApi.list(),
                ordersApi.listOrders(),
                ordersApi.listClients(),
                ordersApi.listLanguages(),
                ordersApi.listEditors(),
                ordersApi.listCurrency(),
                ordersApi.listTraffic(),
            ])

            // Translators
            setTranslators(translatorsRes.results)

            const translatorsMap: Record<number, Translator> = {}
            translatorsRes.results.forEach(t => {
                translatorsMap[t.id] = t
            })
            setTranslatorsCache(translatorsMap)

            // Orders
            setOrders(ordersRes.results)

            // Dictionaries
            setClients(clientsRes.results)
            setLanguages(languagesRes.results)
            setEditors(editorsRes.results)
            setCurrencies(currencyRes.results)
            setTraffics(orderTrafficRes.results)

            // Language pairs
            const uniquePairIds = [
                ...new Set(ordersRes.results.map(o => o.language_pair_id)),
            ]

            if (uniquePairIds.length > 0) {
                const pairs = await Promise.all(
                    uniquePairIds.map(id =>
                        ordersApi.getLanguagePairById(id)
                    )
                )

                const pairsMap: Record<number, LanguagePair> = {}
                pairs.forEach(pair => {
                    pairsMap[pair.id] = pair
                })

                setLanguagePairs(pairsMap)
            }

            initialLoadedRef.current = true
        } catch (e) {
            handleError(e, "Failed to load initial data")
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        loadInitialData()
    }, [loadInitialData])

    /* =========================
       LOAD ORDER DETAILS
    ========================= */

    const loadOrderDetails = async (orderId: number): Promise<Details> => {
        try {
            setLoading(true)
            const res = await ordersApi.getById(orderId)
            setOrderDetails(res)
            return res
        } catch (e) {
            handleError(e, "Failed to load order details")
            throw e
        } finally {
            setLoading(false)
        }
    }

    /* =========================
       LANGUAGE PAIR CACHE
    ========================= */

    const loadLanguagePair = useCallback(
        async (pairId: number) => {
            if (languagePairs[pairId]) {
                return languagePairs[pairId]
            }

            const pair = await ordersApi.getLanguagePairById(pairId)

            setLanguagePairs(prev => ({
                ...prev,
                [pairId]: pair,
            }))

            return pair
        },
        [languagePairs]
    )

    /* =========================
       TRANSLATOR CACHE
    ========================= */

    const getTranslatorById = useCallback(
        (translatorId: number | null): Translator | null => {
            if (!translatorId) {return null}
            return translatorsCache[translatorId] || null
        },
        [translatorsCache]
    )

    /* =========================
       RETURN
    ========================= */

    return {
        // state
        loading,
        orders,
        order,
        orderDetail,
        translators,
        clients,
        languages,
        editors,
        currencies,
        traffics,
        languagePairs,

        // actions
        createOrder,
        loadOrderDetails,
        loadLanguagePair,
        loadInitialData,

        // translators
        translatorsCache,
        getTranslatorById,
        selectedTranslatorId,
        setSelectedTranslatorId,
    }
}
