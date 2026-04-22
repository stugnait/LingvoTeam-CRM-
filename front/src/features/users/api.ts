import { apiFetch } from "@/src/shared/api/client"
import type { User, UserFormData, UsersListResponse } from "./types"

// 👇 Допоміжна функція для створення FormData
const buildFormData = (data: UserFormData): FormData => {
    const formData = new FormData()

    Object.entries(data).forEach(([key, value]) => {
        if (key === "avatar") {
            // Якщо це новий файл — додаємо його
            if (value instanceof File) {
                formData.append(key, value)
            }
            // Якщо юзер видалив аватарку (null) — відправляємо порожній рядок, щоб бекенд її стер
            else if (value === null) {
                formData.append(key, "")
            }
            // Якщо це просто string (старе посилання) — ігноруємо, не відправляємо
        }
        else if (value !== null && value !== undefined) {
            // Всі інші текстові поля та числа конвертуємо в рядок
            formData.append(key, String(value))
        }
    })

    return formData
}

export const usersApi = {

    list: (params?: {
        search?: string
        role?: string
        status?: boolean | null
        page?: number
    }) => {
        const query = new URLSearchParams()

        if (params?.page) {query.append("page", params.page.toString())}
        if (params?.search) {query.append("search", params.search)}
        if (params?.role && params.role !== "all") {query.append("role__slug", params.role)}
        if (params?.status !== null && params?.status !== undefined) {
            query.append("is_active", String(params.status))
        }

        const url = query.toString() ? `users/users/?${query.toString()}` : "users/users/"

        return apiFetch<UsersListResponse>(url, { method: "GET" })
    },

    getById: (id: string) =>
        apiFetch<User>(`users/${id}/`, { method: "GET" }),

    // 👇 Замінили JSON.stringify на buildFormData(data)
    create: (data: UserFormData) =>
        apiFetch<User>("users/", {
            method: "POST",
            body: buildFormData(data),
        }),

    // 👇 Замінили JSON.stringify на buildFormData(data)
    register: (data: UserFormData) =>
        apiFetch("users/auth/register/", {
            method: "POST",
            body: buildFormData(data),
        }),

    // 👇 Замінили JSON.stringify на buildFormData(data)
    update: (id: string, data: UserFormData) =>
        apiFetch<User>(`users/${id}/`, {
            method: "PATCH",
            body: buildFormData(data),
        }),

    remove: (id: string) =>
        apiFetch<void>(`users/${id}/`, { method: "DELETE" }),

    deactivate: (id: string) =>
        apiFetch<void>(`users/admin/users/${id}/toggle-status/`, { method: "POST" }),
}