"use client"

import {useCallback, useEffect, useState} from "react"
import { ordersApi } from "../api"
import type {
    CreateOrderPayload,
    CreateOrderResponse,
    OrderListItem,
    Details,
    LanguagePair,
    Translator
} from "../types"
import { useToast } from "@/src/hooks/use-toast"
import { useRouter } from "next/navigation"
import {translatorsApi} from "@/src/features/translators/api";

export function useOrders() {
    const { toast } = useToast()
    const router = useRouter()
    const [translators, setTranslators] = useState<Translator[]>([])
    const [selectedTranslatorId, setSelectedTranslatorId] = useState<number | null>(null)

    const [loading, setLoading] = useState(false)
    const [order, setOrder] = useState<CreateOrderResponse | null>(null)
    const [orderDetail, setOrderDetails] = useState<Details | null>(null)
    const [languagePairs, setLanguagePairs] = useState<Record<number, LanguagePair>>({})
    const [translatorsCache, setTranslatorsCache] = useState<Record<number, Translator>>({})

    const [orders, setOrders] = useState<OrderListItem[]>([])

    const createOrder = async (data: CreateOrderPayload) => {
        setLoading(true)

        try {
            const formData = new FormData()

            formData.append("client_id", String(data.client_id))
            formData.append("source_language", String(data.source_language))
            formData.append("target_language", String(data.target_language))
            formData.append("traffic_id", String(data.traffic_id))
            formData.append("translator_traffic_id", String(data.translator_traffic_id))
            formData.append("currency_id_id", String(data.currency_id_id))
            formData.append("language_pair_id", String(data.language_pair_id))
            formData.append("editor_id", String(data.editor_id))

            if (data.translator_id) {
                formData.append("translator_id", String(data.translator_id))
            }

            if (data.translator_traffic_id) {
                formData.append("translator_traffic_id", String(data.translator_traffic_id))
            }

            data.files?.forEach((file) => {
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
        } catch (e: any) {
            toast({
                title: "Error",
                description: e?.detail || "Failed to create order",
                variant: "error",
            })
            throw e
        } finally {
            setLoading(false)
        }
    }

    const loadTranslators = useCallback(async () => {
        try {
            setLoading(true)
            const response = await translatorsApi.list()
            setTranslators(response.results)

            // ✅ Кешуємо перекладачів одразу після завантаження
            const cache: Record<number, Translator> = {}
            response.results.forEach(translator => {
                cache[translator.id] = translator
            })
            setTranslatorsCache(cache)
        } catch {
            toast({
                title: "Error",
                description: "Failed to load translators",
                variant: "error",
            })
        } finally {
            setLoading(false)
        }
    }, [toast])

    const loadOrders = useCallback(async () => {
        try {
            setLoading(true)
            const response = await ordersApi.listOrders()
            setOrders(response.results)

            // ✅ Завантажуємо мовні пари
            await Promise.all(
                response.results.map(o =>
                    loadLanguagePair(o.language_pair_id)
                )
            )
        } catch {
            toast({
                title: "Error",
                description: "Failed to load orders",
                variant: "error",
            })
        } finally {
            setLoading(false)
        }
    }, [])

    const loadOrderDetails = async (orderId: number): Promise<Details> => {
        try {
            setLoading(true)
            const res = await ordersApi.getById(orderId)
            setOrderDetails(res)
            return res
        } catch (e: any) {
            toast({
                title: "Error",
                description: e?.detail || "Failed to load order details",
                variant: "error",
            })
            throw e
        } finally {
            setLoading(false)
        }
    }

    const loadLanguagePair = useCallback(async (pairId: number) => {
        if (languagePairs[pairId]) {
            return languagePairs[pairId]
        }

        const pair = await ordersApi.getLanguagePairById(pairId)

        setLanguagePairs(prev => ({
            ...prev,
            [pairId]: pair,
        }))

        return pair
    }, [languagePairs])

    // ✅ Функція для отримання перекладача по ID
    const getTranslatorById = useCallback((translatorId: number | null): Translator | null => {
        if (!translatorId) {return null}
        return translatorsCache[translatorId] || null
    }, [translatorsCache])

    useEffect(() => {
        loadTranslators()
        loadOrders()
    }, [loadTranslators, loadOrders])

    return {
        // CREATE
        createOrder,

        // READ
        orders,
        order,
        loadOrders,
        loadOrderDetails,
        loadLanguagePair,
        languagePairs,

        // UI
        loading,

        // TRANSLATORS
        translators,
        translatorsCache,
        getTranslatorById,
        selectedTranslatorId,
        setSelectedTranslatorId,
    }
}