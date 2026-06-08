import { apiFetch } from "@/src/shared/api/client"
import type {
    TranslatorStatItem,
    TranslatorStatsParams,
    TranslatorDetailData,
    TranslatorDetailParams,
    TranslatorOrder,
    TranslatorOrdersParams,
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
    if (Array.isArray(res)) return res
    return res.results ?? []
}

export const translatorStatsApi = {
    // GET /api/stats/dashboard/translators-stats/
    getStats: (params?: TranslatorStatsParams) =>
        apiFetch<TranslatorStatItem[]>(
            `stats/dashboard/translators-stats/${buildQS(params as Record<string, string | undefined>)}`,
            { method: "GET" }
        ),

    // GET /api/stats/dashboard/translators-stats/{id}/details/
    getDetail: (translatorId: number, params?: TranslatorDetailParams) =>
        apiFetch<TranslatorDetailData>(
            `stats/dashboard/translators-stats/${translatorId}/details/${buildQS(params)}`,
            { method: "GET" }
        ),

    // GET /api/stats/details/?translator={id}&...
    getOrders: async (params?: TranslatorOrdersParams): Promise<TranslatorOrder[]> => {
        const res = await apiFetch<MaybePagedResponse<TranslatorOrder>>(
            `stats/details/${buildQS(params as Record<string, string | undefined>)}`,
            { method: "GET" }
        )
        return unwrap(res)
    },
}