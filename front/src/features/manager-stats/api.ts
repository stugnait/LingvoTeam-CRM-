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

// DRF може повертати або масив або пагінований об'єкт
type MaybePagedResponse<T> = T[] | { count: number; next: string | null; previous: string | null; results: T[] }

function unwrap<T>(res: MaybePagedResponse<T>): T[] {
    if (Array.isArray(res)) return res
    return res.results ?? []
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

    // GET /api/stats/details/?manager={id}&...
    getOrders: async (params?: ManagerOrdersParams): Promise<ManagerOrder[]> => {
        const res = await apiFetch<MaybePagedResponse<ManagerOrder>>(
            `stats/details/${buildQS(params as Record<string, string | undefined>)}`,
            { method: "GET" }
        )
        return unwrap(res)
    },
}