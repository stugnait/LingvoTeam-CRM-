import { useCallback, useState } from "react"
import { managerStatsApi } from "../api"
import type {
    ManagerStatItem,
    ManagerStatsParams,
    ManagerDetailData,
    ManagerDetailParams,
    ManagerOrder,
    ManagerOrdersParams,
} from "../types"

// ── Список менеджерів ─────────────────────────────────────────────────────────
export function useManagerStats() {
    const [data, setData]       = useState<ManagerStatItem[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError]     = useState<string | null>(null)

    const fetchStats = useCallback(async (params?: ManagerStatsParams) => {
        setLoading(true)
        setError(null)
        try {
            const res = await managerStatsApi.getStats(params)
            setData(res)
        } catch (e: any) {
            setError(e?.message || e?.detail || "Помилка завантаження статистики менеджерів")
        } finally {
            setLoading(false)
        }
    }, [])

    return { data, loading, error, fetchStats }
}

// ── Деталі одного менеджера ───────────────────────────────────────────────────
export function useManagerDetail(managerId: number) {
    const [data, setData]       = useState<ManagerDetailData | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError]     = useState<string | null>(null)

    const fetchDetail = useCallback(async (params?: ManagerDetailParams) => {
        setLoading(true)
        setError(null)
        try {
            const res = await managerStatsApi.getDetail(managerId, params)
            setData(res)
        } catch (e: any) {
            setError(e?.message || e?.detail || "Помилка завантаження даних менеджера")
        } finally {
            setLoading(false)
        }
    }, [managerId])

    return { data, loading, error, fetchDetail }
}

// ── Замовлення менеджера ──────────────────────────────────────────────────────
export function useManagerOrders(managerId: number) {
    const [data, setData]       = useState<ManagerOrder[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError]     = useState<string | null>(null)

    const fetchOrders = useCallback(async (params?: Omit<ManagerOrdersParams, "manager">) => {
        setLoading(true)
        setError(null)
        try {
            const res = await managerStatsApi.getOrders({
                ...params,
                manager: String(managerId),
            })
            setData(res)
        } catch (e: any) {
            setError(e?.message || e?.detail || "Помилка завантаження замовлень")
        } finally {
            setLoading(false)
        }
    }, [managerId])

    return { data, loading, error, fetchOrders }
}