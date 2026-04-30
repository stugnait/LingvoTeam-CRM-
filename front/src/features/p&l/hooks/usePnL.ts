"use client"

import { useEffect, useState } from "react"
import { financeApi } from "../api"
import { PnLResponse, SalesChartResponse } from "../types" // Додали SalesChartResponse

export function usePnL(startDate: string, endDate: string, groupBy?: string) {

    const [data, setData] = useState<PnLResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchPnL = async () => {
        try {
            setLoading(true)

            const res = await financeApi.getPnL(startDate, endDate, groupBy)

            setData(res as PnLResponse)

        } catch (err) {
            setError("Failed to load PnL")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!startDate || !endDate) {return}
        fetchPnL()
    }, [startDate, endDate, groupBy])

    return {
        data,
        loading,
        error,
        refetch: fetchPnL
    }
}

export function useSalesChart(startDate: string, endDate: string) {

    const [data, setData] = useState<SalesChartResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Тимчасово для тесту
    const fetchSalesChart = async () => {
        try {
            setLoading(true)
            // реальний запит:
            // const res = await financeApi.getSalesChart(startDate, endDate)

            // фейкові дані:
            const res = [
                { date: "2024-05-20", daily_revenue: 1200 },
                { date: "2024-05-21", daily_revenue: 800 },
                { date: "2024-05-22", daily_revenue: 2500 },
                { date: "2024-05-23", daily_revenue: 1700 },
            ] as SalesChartResponse

            setData(res)
        } catch (err) {
            setError("Failed to load Sales Chart data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!startDate || !endDate) {return}
        fetchSalesChart()
    }, [startDate, endDate])

    return {
        data,
        loading,
        error,
        refetch: fetchSalesChart
    }
}