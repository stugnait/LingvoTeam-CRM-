import { apiFetch } from "@/src/shared/api/client"
import type { User, UserFormData, UsersListResponse } from "./types"

export const usersApi = {

    // GET /users/?search=&role=&status=
    list: (params?: {
        search?: string
        role?: string
        status?: boolean | null
    }) => {

        const query = new URLSearchParams()

        if (params?.search) {
            query.append("search", params.search)
        }

        if (params?.role && params.role !== "all") {
            query.append("role__slug", params.role)
        }

        if (params?.status !== null && params?.status !== undefined) {
            query.append("is_active", String(params.status))
        }

        const url = query.toString()
            ? `users/users/?${query.toString()}`
            : "users/users/"

        return apiFetch<UsersListResponse>(url, {
            method: "GET",
        })
    },

    getById: (id: string) =>
        apiFetch<User>(`users/${id}/`, { method: "GET" }),

    create: (data: UserFormData) =>
        apiFetch<User>("users/", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    register: (data: UserFormData) =>
        apiFetch("users/auth/register/", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    update: (id: string, data: UserFormData) =>
        apiFetch<User>(`users/${id}/`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    remove: (id: string) =>
        apiFetch<void>(`users/${id}/`, { method: "DELETE" }),

    deactivate: (id: string) =>
        apiFetch<void>(`users/admin/users/${id}/toggle-status/`, {
            method: "POST"
        }),
}