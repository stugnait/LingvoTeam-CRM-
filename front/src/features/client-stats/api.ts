import { apiFetch } from "@/src/shared/api/client"
import type {
    ClientStatItem,
    ClientStatsParams,
    ClientDetailData,
    ClientDetailParams,
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

export const clientStatsApi = {
    // GET /api/stats/dashboard/clients-stats/
    getStats: (params?: ClientStatsParams) =>
        apiFetch<ClientStatItem[]>(
            `stats/dashboard/clients-stats/${buildQS(params)}`,
            { method: "GET" }
        ),

    // GET /api/stats/dashboard/clients-stats/{id}/details/
    getDetail: (clientId: number, params?: ClientDetailParams) =>
        apiFetch<ClientDetailData>(
            `stats/dashboard/clients-stats/${clientId}/details/${buildQS(params)}`,
            { method: "GET" }
        ),
}