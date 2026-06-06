import { useCallback, useState } from "react"
import { translatorStatsApi } from "../api"
import type {
    TranslatorStatItem,
    TranslatorStatsParams,
    TranslatorDetailData,
    TranslatorDetailParams,
    TranslatorOrder,
    TranslatorOrdersParams,
} from "../types"

// ── Список перекладачів ───────────────────────────────────────────────────────
export function useTranslatorStats() {
    const [data, setData]       = useState<TranslatorStatItem[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError]     = useState<string | null>(null)

    const fetchStats = useCallback(async (params?: TranslatorStatsParams) => {
        setLoading(true)
        setError(null)
        try {
            const res = await translatorStatsApi.getStats(params)
            setData(res)
        } catch (e: any) {
            setError(e?.message || e?.detail || "Помилка завантаження статистики перекладачів")
        } finally {
            setLoading(false)
        }
    }, [])

    return { data, loading, error, fetchStats }
}

// ── Деталі одного перекладача ─────────────────────────────────────────────────
export function useTranslatorDetail(translatorId: number) {
    const [data, setData]       = useState<TranslatorDetailData | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError]     = useState<string | null>(null)

    const fetchDetail = useCallback(async (params?: TranslatorDetailParams) => {
        setLoading(true)
        setError(null)
        try {
            const res = await translatorStatsApi.getDetail(translatorId, params)
            setData(res)
        } catch (e: any) {
            setError(e?.message || e?.detail || "Помилка завантаження даних перекладача")
        } finally {
            setLoading(false)
        }
    }, [translatorId])

    return { data, loading, error, fetchDetail }
}

// ── Замовлення перекладача ────────────────────────────────────────────────────
export function useTranslatorOrders(translatorId: number) {
    const [data, setData]       = useState<TranslatorOrder[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError]     = useState<string | null>(null)

    const fetchOrders = useCallback(async (params?: Omit<TranslatorOrdersParams, "translator">) => {
        setLoading(true)
        setError(null)
        try {
            const res = await translatorStatsApi.getOrders({
                ...params,
                translator: String(translatorId),
            })
            setData(res)
        } catch (e: any) {
            setError(e?.message || e?.detail || "Помилка завантаження замовлень")
        } finally {
            setLoading(false)
        }
    }, [translatorId])

    return { data, loading, error, fetchOrders }
}