import { apiFetch } from "@/src/shared/api/client"
import type {Permission, Role, RoleFormData, User, UserFormData, UsersListResponse} from "./types"

// 👇 Допоміжна функція для створення FormData
const buildFormData = (data: UserFormData): FormData => {
    const formData = new FormData()

    Object.entries(data).forEach(([key, value]) => {
        if (key === "avatar") {
            // Якщо це новий файл — додаємо
            if (value instanceof File) {
                formData.append(key, value)
            }
            // Якщо null — просто не відправляємо взагалі
            // бекенд залишить старе значення при PATCH
        }
        else if (value !== null && value !== undefined) {
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
        apiFetch<User>(`users/users/${id}/`, {
            method: "PATCH",
            body: buildFormData(data),
        }),

    resetPass: (id: string) =>
        apiFetch<void>(`users/users/${id}/reset-password/`, {
            method: "POST"
        }),

    remove: (id: string) =>
        apiFetch<void>(`users/users/${id}/`, { method: "DELETE" }),

    deactivate: (id: string) =>
        apiFetch<void>(`users/admin/users/${id}/toggle-status/`, { method: "POST" }),
}

export const permissionsApi = {
    list: () =>
        apiFetch<Permission[]>("users/permissions/", { method: "GET" }),
}

export const rolesApi = {
    list: () =>
        apiFetch<Role[]>("users/roles/", { method: "GET" }),

    create: (data: RoleFormData) =>
        apiFetch<Role>("users/roles/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        }),

    update: (id: number, data: RoleFormData) =>
        apiFetch<Role>(`users/roles/${id}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        }),

    remove: (id: number) =>
        apiFetch<void>(`users/roles/${id}/`, { method: "DELETE" }),

    setPermissions: (id: number, permission_ids: number[]) =>
        apiFetch<Role>(`users/roles/${id}/set-permissions/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ permission_ids }),
        }),
}