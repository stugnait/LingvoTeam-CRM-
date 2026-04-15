// salary/hooks/useSalary.ts

import { useEffect, useState } from "react"
import { salaryApi } from "../api"
import {
    Salary,
    SalaryCreatePayload,
} from "../types"

export function useSalary(role?: number) {
    const [data, setData] = useState<Salary[]>([])
    const [loading, setLoading] = useState(false)

    // -------------------------
    // LOAD
    // -------------------------
    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await salaryApi.list({
                role, // 🔥 ПЕРЕДАЄМО
            })
            setData(res.results || res)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [role]) // 🔥 ВАЖЛИВО — рефетч при зміні вкладки

    // -------------------------
    // CREATE
    // -------------------------
    const createSalary = async (payload: SalaryCreatePayload) => {
        await salaryApi.create(payload)
        await fetchData()
    }

    // -------------------------
    // UPDATE
    // -------------------------
    const updateSalary = async (
        id: number,
        payload: Partial<SalaryCreatePayload>
    ) => {
        await salaryApi.update(id, payload)
        await fetchData()
    }

    // -------------------------
    // DELETE
    // -------------------------
    const deleteSalary = async (id: number) => {
        await salaryApi.delete(id)
        await fetchData()
    }

    return {
        data,
        loading,
        createSalary,
        updateSalary,
        deleteSalary,
        refetch: fetchData,
    }
}