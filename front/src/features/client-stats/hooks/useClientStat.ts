import { useCallback, useState } from "react"
import { clientStatsApi } from "../api"
import type {
    ClientStatItem,
    ClientStatsParams,
    ClientDetailData,
    ClientDetailParams,
} from "../types"

// ── Список клієнтів ───────────────────────────────────────────────────────────
export function useClientStats() {
    const [data, setData]       = useState<ClientStatItem[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError]     = useState<string | null>(null)

    const fetchStats = useCallback(async (params?: ClientStatsParams) => {
        setLoading(true)
        setError(null)
        try {
            const res = await clientStatsApi.getStats(params)
            setData(res)
        } catch (e: any) {
            setError(e?.message || e?.detail || "Помилка завантаження статистики")
        } finally {
            setLoading(false)
        }
    }, [])

    return { data, loading, error, fetchStats }
}

// ── Деталі одного клієнта ─────────────────────────────────────────────────────
export function useClientDetail(clientId: number) {
    const [data, setData]       = useState<ClientDetailData | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError]     = useState<string | null>(null)

    const fetchDetail = useCallback(async (params?: ClientDetailParams) => {
        setLoading(true)
        setError(null)
        try {
            const res = await clientStatsApi.getDetail(clientId, params)
            setData(res)
        } catch (e: any) {
            setError(e?.message || e?.detail || "Помилка завантаження даних клієнта")
        } finally {
            setLoading(false)
        }
    }, [clientId])

    return { data, loading, error, fetchDetail }
}