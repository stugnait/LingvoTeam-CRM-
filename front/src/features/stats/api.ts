// statistics/api.ts

import { apiFetch } from "@/src/shared/api/client"
import {
    OwnerOrder,
    OwnerOrdersResponse,
    Order,
    StatsItem,
    ConversionStats,
    SalesChartItem,
    PnLResponse,
} from "./types"

export const statisticsApi = {
    // -------------------------
    // Owner Orders (list + detail)
    // -------------------------
    listOwnerOrders: (params?: {
        search?: string
        manager?: number
        client?: number
        translator?: number
        status?: number
        ordering?: string
    }) => {
        const query = new URLSearchParams(
            Object.entries(params || {})
                .filter(([_, v]) => v !== undefined)
                .map(([k, v]) => [k, String(v)]) // 🔥 ОЦЕ ФІКС
        ).toString()

        return apiFetch<OwnerOrdersResponse>(
            `statistics/owner-orders/?${query}`,
            { method: "GET" }
        )
    },

    getOwnerOrder: (id: number) =>
        apiFetch<OwnerOrder>(`stats/dashboard/owner-orders/${id}/`, {
            method: "GET",
        }),

    // -------------------------
    // Dashboard
    // -------------------------
    unpaidOrders: () =>
        apiFetch<Order[]>("stats/dashboard/unpaid-orders/", {
            method: "GET",
        }),

    overduePayments: () =>
        apiFetch<Order[]>("stats/dashboard/overdue-payments/", {
            method: "GET",
        }),

    highRiskOrders: () =>
        apiFetch<Order[]>("stats/dashboard/high-risk/", {
            method: "GET",
        }),

    conversion: (params: { start_date: string; end_date: string }) => {
        const query = new URLSearchParams(params).toString()

        return apiFetch<ConversionStats>(
            `stats/dashboard/conversion/?${query}`,
            { method: "GET" }
        )
    },

    salesChart: (params: { start_date: string; end_date: string }) => {
        const query = new URLSearchParams(params).toString()

        return apiFetch<SalesChartItem[]>(
            `stats/dashboard/sales-chart/?${query}`,
            { method: "GET" }
        )
    },

    managersStats: (params?: { start_date?: string; end_date?: string }) => {
        const query = new URLSearchParams(
            Object.fromEntries(
                Object.entries(params || {}).filter(([_, v]) => v !== undefined)
            )
        ).toString()

        return apiFetch<StatsItem[]>(
            `stats/dashboard/managers-stats/?${query}`,
            { method: "GET" }
        )
    },

    clientsStats: (params?: { start_date?: string; end_date?: string }) => {
        const query = new URLSearchParams(
            Object.fromEntries(
                Object.entries(params || {}).filter(([_, v]) => v !== undefined)
            )
        ).toString()

        return apiFetch<StatsItem[]>(
            `stats/dashboard/clients-stats/?${query}`,
            { method: "GET" }
        )
    },

    translatorsStats: (params?: { start_date?: string; end_date?: string }) => {
        const query = new URLSearchParams(
            Object.fromEntries(
                Object.entries(params || {}).filter(([_, v]) => v !== undefined)
            )
        ).toString()

        return apiFetch<StatsItem[]>(
            `stats/dashboard/translators-stats/?${query}`,
            { method: "GET" }
        )
    },

    // -------------------------
    // PnL
    // -------------------------
    getPnL: (params: {
        start_date: string
        end_date: string
        group_by?: "client" | "manager" | "translator" | "language_pair"
    }) => {
        const query = new URLSearchParams(
            Object.fromEntries(
                Object.entries(params).filter(([_, v]) => v !== undefined)
            )
        ).toString()

        return apiFetch<PnLResponse>(
            `stats/dashboard/pnl/?${query}`,
            { method: "GET" }
        )
    },
}