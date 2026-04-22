// api.ts
import { apiFetch } from "@/src/shared/api/client";
import {
    Salary,
    SalaryCreatePayload,
    PaginatedResponse,
    SalaryPreview,
    User
} from "./types";

export const usersApi = {
    // Стандартний список (якщо десь потрібен)
    list: (roleId?: number) => {
        const query = roleId ? `?role=${roleId}` : "";
        return apiFetch<PaginatedResponse<User> | User[]>(
            `users/${query}`,
            { method: "GET" }
        );
    },

    // 🔥 НОВА ЧИСТА ФУНКЦІЯ: Отримати юзерів спеціально для зарплат
    getForSalary: (roleId?: number) => {
        const query = roleId ? `?role=${roleId}` : "";
        return apiFetch<User[]>(
            `users/users/for-salary/${query}`,
            { method: "GET" }
        );
    }
};

export const salaryApi = {
    list: (params?: { user?: number; start_date?: string; end_date?: string; role?: number; }) => {
        const query = new URLSearchParams(
            Object.entries(params || {})
                .filter(([_, v]) => v !== undefined && v !== null && v !== "")
                .map(([k, v]) => [k, String(v)])
        ).toString();
        return apiFetch<PaginatedResponse<Salary> | Salary[]>(`salary/?${query}`, { method: "GET" });
    },

    get: (id: number) =>
        apiFetch<Salary>(`salary/${id}/`, { method: "GET" }),

    preview: (params: {
        user: number;
        start_date: string;
        end_date: string;
    }) => {
        const query = new URLSearchParams({
            user: String(params.user),
            start_date: params.start_date,
            end_date: params.end_date,
        }).toString();

        return apiFetch<SalaryPreview>(
            `salary/preview/?${query}`,
            { method: "GET" }
        );
    },

    create: (data: SalaryCreatePayload) =>
        apiFetch<Salary>(`salary/`, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    update: (
        id: number,
        data: Partial<Pick<Salary, "base_salary" | "bonus" | "premium" | "status">>
    ) =>
        apiFetch<Salary>(`salary/${id}/`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    delete: (id: number) =>
        apiFetch<void>(`salary/${id}/`, { method: "DELETE" }),
};