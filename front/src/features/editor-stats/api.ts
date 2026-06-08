import { apiFetch } from "@/src/shared/api/client"
import type {
    EditorDetailData,
    EditorDetailParams,
    EditorOrder,
    EditorOrdersParams, EditorStatItem, EditorStatsParams,
} from "./types"

function buildQS(params?: Record<string, string | undefined>) {
    const query = new URLSearchParams()
    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            if (v) query.set(k, v)
        })
    }
    const qs = query.toString()
    return qs ? `?${qs}` : ""
}

type MaybePagedResponse<T> = T[] | { count: number; next: string | null; previous: string | null; results: T[] }

function unwrap<T>(res: MaybePagedResponse<T>): T[] {
    if (Array.isArray(res)) {return res}
    return res.results ?? []
}

export const editorStatsApi = {
    // GET /api/stats/dashboard/editors-stats/
    getStats: (params?: EditorStatsParams) =>
        apiFetch<EditorStatItem[]>(
            `stats/dashboard/editors-stats/${buildQS(params as Record<string, string | undefined>)}`,
            { method: "GET" }
        ),

    getDetail: (editorId: number, params?: EditorDetailParams) =>
        apiFetch<EditorDetailData>(
            `stats/dashboard/editors-stats/${editorId}/details/${buildQS(params)}`,
            { method: "GET" }
        ),

    // GET /api/stats/details/?editor={id}&...
    getOrders: async (params?: EditorOrdersParams): Promise<EditorOrder[]> => {
        const res = await apiFetch<MaybePagedResponse<EditorOrder>>(
            `stats/details/${buildQS(params as Record<string, string | undefined>)}`,
            { method: "GET" }
        )
        return unwrap(res)
    },
}