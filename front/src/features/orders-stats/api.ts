import { apiFetch } from "@/src/shared/api/client"
import type { OrderItem, OrdersParams } from "./types"

function buildQS(params?: Record<string, string | undefined>) {
    const query = new URLSearchParams()
    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== "") query.set(k, v)
        })
    }
    const qs = query.toString()
    return qs ? `?${qs}` : ""
}

type MaybePagedResponse<T> =
    | T[]
    | { count: number; next: string | null; previous: string | null; results: T[] }

function unwrap<T>(res: MaybePagedResponse<T>): T[] {
    if (Array.isArray(res)) return res
    return res.results ?? []
}

export const ordersStatsApi = {
    // GET /api/stats/details/?...
    getOrders: async (params?: OrdersParams): Promise<OrderItem[]> => {
        const res = await apiFetch<MaybePagedResponse<OrderItem>>(
            `stats/details/${buildQS(params as Record<string, string | undefined>)}`,
            { method: "GET" }
        )
        return unwrap(res)
    },
}