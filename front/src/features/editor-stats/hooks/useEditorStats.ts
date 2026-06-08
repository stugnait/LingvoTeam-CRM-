import { useCallback, useState } from "react"
import { editorStatsApi } from "../api"
import type {
    EditorDetailData,
    EditorDetailParams,
    EditorOrder,
    EditorOrdersParams, EditorStatItem, EditorStatsParams,
} from "../types"

export function useEditorStats() {
    const [data, setData] = useState<EditorStatItem[]>([])
    const [loading, setLoading] = useState(false)

    const fetchStats = useCallback(async (params?: EditorStatsParams) => {
        setLoading(true)
        try {
            const res = await editorStatsApi.getStats(params)
            setData(res || [])
        } catch (error) {
            console.error("Помилка завантаження статистики редакторів:", error)
        } finally {
            setLoading(false)
        }
    }, [])

    return { data, loading, fetchStats }
}



// ── Деталі одного редактора ───────────────────────────────────────────────────
export function useEditorDetail(editorId: number) {
    const [data, setData]       = useState<EditorDetailData | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError]     = useState<string | null>(null)

    const fetchDetail = useCallback(async (params?: EditorDetailParams) => {
        setLoading(true)
        setError(null)
        try {
            const res = await editorStatsApi.getDetail(editorId, params)
            setData(res)
        } catch (e: any) {
            setError(e?.message || e?.detail || "Помилка завантаження даних редактора")
        } finally {
            setLoading(false)
        }
    }, [editorId])

    return { data, loading, error, fetchDetail }
}

// ── Замовлення редактора ──────────────────────────────────────────────────────
export function useEditorOrders(editorId: number) {
    const [data, setData]       = useState<EditorOrder[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError]     = useState<string | null>(null)

    const fetchOrders = useCallback(async (params?: Omit<EditorOrdersParams, "editor">) => {
        setLoading(true)
        setError(null)
        try {
            const res = await editorStatsApi.getOrders({
                ...params,
                editor: String(editorId),
            })
            setData(res)
        } catch (e: any) {
            setError(e?.message || e?.detail || "Помилка завантаження замовлень")
        } finally {
            setLoading(false)
        }
    }, [editorId])

    return { data, loading, error, fetchOrders }
}