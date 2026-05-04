// api.ts
import { apiFetch } from "@/src/shared/api/client";
import {
    Salary,
    SalaryCreatePayload,
    PaginatedResponse,
    SalaryPreview,
    User
} from "./types";
import type {TranslatorListResponse} from "@/src/features/translators/types";

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
        role?: string; // 🔥 Додаємо role сюди
    }) => {
        // Формуємо параметри динамічно, щоб не передавати undefined
        const queryParams: Record<string, string> = {
            user: String(params.user),
            start_date: params.start_date,
            end_date: params.end_date,
        };

        // 🔥 Якщо роль є, додаємо її до запиту
        if (params.role) {
            queryParams.role = params.role;
        }

        const query = new URLSearchParams(queryParams).toString();

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

export const translatorsApi = {
    // Додали page у параметри
    list: (params?: {
        search?: string
        ordering?: "orders_count" | "-orders_count" | "created_at" | "-created_at"
        source_language?: number
        target_language?: number
        language_pair_id?: number
        page?: number // 🔥 Додано сюди
    }) => {
        const query = new URLSearchParams()

        // 🔥 Беремо з params або за замовчуванням 1
        const page = params?.page || 1;
        query.append("page", String(page));

        // 🔍 search
        if (params?.search) {
            query.append("search", params.search)
        }

        // 📊 sorting
        if (params?.ordering) {
            query.append("ordering", params.ordering)
        }

        // 🌐 filters
        if (params?.source_language) {
            query.append("source_language", String(params.source_language))
        }

        if (params?.target_language) {
            query.append("target_language", String(params.target_language))
        }

        if (params?.language_pair_id) {
            query.append("language_pair_id", String(params.language_pair_id))
        }

        const qs = query.toString()
        const url = `translators/?${qs}`

        return apiFetch<TranslatorListResponse>(url, {
            method: "GET",
        })
    },
}