"use client"

import { useEffect, useState } from "react"
import { financeApi } from "../api"
import { PnLResponse } from "../types"

export function usePnL(startDate: string, endDate: string, groupBy?: string) {

    const [data, setData] = useState<PnLResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchPnL = async () => {
        try {
            setLoading(true)

            const res = await financeApi.getPnL(startDate, endDate, groupBy)

            setData(res)

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