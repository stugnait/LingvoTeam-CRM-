"use client"

import {useCallback, useEffect, useState} from "react"
import { ordersApi } from "../api"
import type {
    CreateOrderPayload,
    CreateOrderResponse,
    OrderListItem,
    OrderListResponse,
} from "../types"
import { useToast } from "@/src/hooks/use-toast"
import { useRouter } from "next/navigation"
import type {Translator} from "@/src/features/translators/types";
import {translatorsApi} from "@/src/features/translators/api";

export function useOrders() {
    const { toast } = useToast()
    const router = useRouter()
    const [translators, setTranslators] = useState<Translator[]>([])
    const [selectedTranslatorId, setSelectedTranslatorId] = useState<number | null>(null)

    const [loading, setLoading] = useState(false)
    const [order, setOrder] = useState<CreateOrderResponse | null>(null)

    const [orders, setOrders] = useState<OrderListItem[]>([])

    const createOrder = async (data: CreateOrderPayload) => {
        setLoading(true)

        try {
            // 🔴 ТУТ і ТІЛЬКИ ТУТ FormData
            const formData = new FormData()

            formData.append("client_id", String(data.client_id))
            formData.append("source_language", String(data.source_language))
            formData.append("target_language", String(data.target_language))
            formData.append("traffic_id", String(data.traffic_id))
            formData.append("translator_traffic_id", String(data.translator_traffic_id))
            formData.append("currency_id_id", String(data.currency_id_id))
            formData.append("language_pair_id", String(data.language_pair_id))

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
        } catch {
            toast({
                title: "Error",
                description: "Failed to load orders",
                variant: "error",
            })
        } finally {
            setLoading(false)
        }
    }, [toast])

    const loadOrderDetails = async (orderId: number): Promise<CreateOrderResponse> => {
        try {
            setLoading(true)
            const res = await ordersApi.getById(orderId)
            setOrder(res) // опційно
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

        // UI
        loading,

        // TRANSLATORS
        translators,
        selectedTranslatorId,
        setSelectedTranslatorId,
    }

}
