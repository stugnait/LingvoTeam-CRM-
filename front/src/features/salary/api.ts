// salary/api.ts

import { apiFetch } from "@/src/shared/api/client"
import {
    Salary,
    SalaryCreatePayload,
    SalaryListResponse,
} from "./types"

export const salaryApi = {
    // -------------------------
    // CRUD
    // -------------------------
    list: (params?: {
        user?: number
        start_date?: string
        end_date?: string
        role?: number // 🔥 ДОДАЛИ
    }) => {
        const query = new URLSearchParams(
            Object.entries(params || {})
                .filter(([_, v]) => v !== undefined)
                .map(([k, v]) => [k, String(v)])
        ).toString()

        return apiFetch<SalaryListResponse>(
            `salary/?${query}`,
            { method: "GET" }
        )
    },

    get: (id: number) =>
        apiFetch<Salary>(`salary/${id}/`, {
            method: "GET",
        }),

    create: (data: SalaryCreatePayload) =>
        apiFetch<Salary>(`salary/`, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    update: (id: number, data: Partial<SalaryCreatePayload>) =>
        apiFetch<Salary>(`salary/${id}/`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    delete: (id: number) =>
        apiFetch<void>(`salary/${id}/`, {
            method: "DELETE",
        }),
}