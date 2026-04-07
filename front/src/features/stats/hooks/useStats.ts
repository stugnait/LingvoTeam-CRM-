"use client"

import { useState } from "react"
import { statisticsApi } from "../api"
import {
    OwnerOrdersResponse,
    OwnerOrder,
    Order,
    StatsItem,
    ConversionStats,
    SalesChartItem,
    PnLResponse,
} from "../types"
import { useToast } from "@/src/hooks/use-toast"

export function useStats() {
    const { toast } = useToast()

    // -------------------------
    // STATE
    // -------------------------
    const [loading, setLoading] = useState(false)

    const [ownerOrders, setOwnerOrders] = useState<OwnerOrdersResponse | null>(null)
    const [selectedOrder, setSelectedOrder] = useState<OwnerOrder | null>(null)

    const [unpaidOrders, setUnpaidOrders] = useState<Order[]>([])
    const [overduePayments, setOverduePayments] = useState<Order[]>([])
    const [highRiskOrders, setHighRiskOrders] = useState<Order[]>([])

    const [conversion, setConversion] = useState<ConversionStats | null>(null)
    const [salesChart, setSalesChart] = useState<SalesChartItem[]>([])

    const [managersStats, setManagersStats] = useState<StatsItem[]>([])
    const [clientsStats, setClientsStats] = useState<StatsItem[]>([])
    const [translatorsStats, setTranslatorsStats] = useState<StatsItem[]>([])

    const [pnl, setPnL] = useState<PnLResponse | null>(null)

    // -------------------------
    // OWNER ORDERS
    // -------------------------
    const fetchOwnerOrders = async (params?: {
        search?: string
        manager?: number
        client?: number
        translator?: number
        status?: number
        ordering?: string
    }) => {
        try {
            setLoading(true)
            const res = await statisticsApi.listOwnerOrders(params)
            setOwnerOrders(res)
        } catch {
            toast({
                title: "Error",
                description: "Failed to load orders",
                variant: "error",
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchOwnerOrder = async (id: number) => {
        try {
            setLoading(true)
            const res = await statisticsApi.getOwnerOrder(id)
            setSelectedOrder(res)
        } catch {
            toast({
                title: "Error",
                description: "Failed to load order",
                variant: "error",
            })
        } finally {
            setLoading(false)
        }
    }

    // -------------------------
    // DASHBOARD
    // -------------------------
    const fetchUnpaidOrders = async () => {
        try {
            setLoading(true)
            const res = await statisticsApi.unpaidOrders()
            setUnpaidOrders(res)
        } catch {
            toast({
                title: "Error",
                description: "Failed to load unpaid orders",
                variant: "error",
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchOverduePayments = async () => {
        try {
            setLoading(true)
            const res = await statisticsApi.overduePayments()
            setOverduePayments(res)
        } catch {
            toast({
                title: "Error",
                description: "Failed to load overdue payments",
                variant: "error",
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchHighRiskOrders = async () => {
        try {
            setLoading(true)
            const res = await statisticsApi.highRiskOrders()
            setHighRiskOrders(res)
        } catch {
            toast({
                title: "Error",
                description: "Failed to load high risk orders",
                variant: "error",
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchConversion = async (params: {
        start_date: string
        end_date: string
    }) => {
        try {
            setLoading(true)
            const res = await statisticsApi.conversion(params)
            setConversion(res)
        } catch {
            toast({
                title: "Error",
                description: "Failed to load conversion",
                variant: "error",
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchSalesChart = async (params: {
        start_date: string
        end_date: string
    }) => {
        try {
            setLoading(true)
            const res = await statisticsApi.salesChart(params)
            setSalesChart(res)
        } catch {
            toast({
                title: "Error",
                description: "Failed to load sales chart",
                variant: "error",
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchManagersStats = async (params?: {
        start_date?: string
        end_date?: string
    }) => {
        try {
            setLoading(true)
            const res = await statisticsApi.managersStats(params)
            setManagersStats(res)
        } catch {
            toast({
                title: "Error",
                description: "Failed to load managers stats",
                variant: "error",
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchClientsStats = async (params?: {
        start_date?: string
        end_date?: string
    }) => {
        try {
            setLoading(true)
            const res = await statisticsApi.clientsStats(params)
            setClientsStats(res)
        } catch {
            toast({
                title: "Error",
                description: "Failed to load clients stats",
                variant: "error",
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchTranslatorsStats = async (params?: {
        start_date?: string
        end_date?: string
    }) => {
        try {
            setLoading(true)
            const res = await statisticsApi.translatorsStats(params)
            setTranslatorsStats(res)
        } catch {
            toast({
                title: "Error",
                description: "Failed to load translators stats",
                variant: "error",
            })
        } finally {
            setLoading(false)
        }
    }

    // -------------------------
    // PnL
    // -------------------------
    const fetchPnL = async (params: {
        start_date: string
        end_date: string
        group_by?: "client" | "manager" | "translator" | "language_pair"
    }) => {
        try {
            setLoading(true)
            const res = await statisticsApi.getPnL(params)
            setPnL(res)
        } catch {
            toast({
                title: "Error",
                description: "Failed to load PnL",
                variant: "error",
            })
        } finally {
            setLoading(false)
        }
    }

    return {
        // state
        loading,

        ownerOrders,
        selectedOrder,

        unpaidOrders,
        overduePayments,
        highRiskOrders,

        conversion,
        salesChart,

        managersStats,
        clientsStats,
        translatorsStats,

        pnl,

        // actions
        fetchOwnerOrders,
        fetchOwnerOrder,

        fetchUnpaidOrders,
        fetchOverduePayments,
        fetchHighRiskOrders,

        fetchConversion,
        fetchSalesChart,

        fetchManagersStats,
        fetchClientsStats,
        fetchTranslatorsStats,

        fetchPnL,
    }
}