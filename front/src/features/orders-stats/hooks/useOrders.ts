import { useCallback, useState } from "react"
import { ordersStatsApi } from "../api"
import type { OrderItem, OrdersParams } from "../types"

export function useOrders() {
    const [data, setData]       = useState<OrderItem[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError]     = useState<string | null>(null)

    const fetchOrders = useCallback(async (params?: OrdersParams) => {
        setLoading(true)
        setError(null)
        try {
            const res = await ordersStatsApi.getOrders(params)
            setData(res)
        } catch (e: any) {
            setError(e?.message || e?.detail || "Помилка завантаження замовлень")
        } finally {
            setLoading(false)
        }
    }, [])

    return { data, loading, error, fetchOrders }
}