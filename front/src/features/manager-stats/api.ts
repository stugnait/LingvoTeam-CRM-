import { apiFetch } from "@/src/shared/api/client"
import type {
    ManagerStatItem,
    ManagerStatsParams,
    ManagerDetailData,
    ManagerDetailParams,
    ManagerOrder,
    ManagerOrdersParams,
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

export const managerStatsApi = {
    // GET /api/stats/dashboard/managers-stats/
    getStats: (params?: ManagerStatsParams) =>
        apiFetch<ManagerStatItem[]>(
            `stats/dashboard/managers-stats/${buildQS(params)}`,
            { method: "GET" }
        ),

    // GET /api/stats/dashboard/managers-stats/{id}/details/
    getDetail: (managerId: number, params?: ManagerDetailParams) =>
        apiFetch<ManagerDetailData>(
            `stats/dashboard/managers-stats/${managerId}/details/${buildQS(params)}`,
            { method: "GET" }
        ),

    // GET /api/stats/orders/?manager={id}&...
    getOrders: (params?: ManagerOrdersParams) =>
        apiFetch<ManagerOrder[]>(
            `stats/orders/${buildQS(params as Record<string, string | undefined>)}`,
            { method: "GET" }
        ),
}