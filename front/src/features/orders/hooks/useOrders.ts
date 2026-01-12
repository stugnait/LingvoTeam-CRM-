"use client"

import { useState } from "react"
import { ordersApi } from "../api"
import type { CreateOrderPayload, CreateOrderResponse } from "../types"
import { useToast } from "@/src/hooks/use-toast"
import { useRouter } from "next/navigation"

export function useOrders() {
    const { toast } = useToast()
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [order, setOrder] = useState<CreateOrderResponse | null>(null)

    const createOrder = async (data: CreateOrderPayload) => {
        setLoading(true)

        try {
            // 🔴 ТУТ і ТІЛЬКИ ТУТ FormData
            const formData = new FormData()

            formData.append("client_id", String(data.client_id))
            formData.append("source_language", String(data.source_language))
            formData.append("target_language", String(data.target_language))
            formData.append("traffic_id", String(data.traffic_id))

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

    return {
        createOrder,
        loading,
        order,
    }
}
