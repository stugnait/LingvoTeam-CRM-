import { apiFetch } from "@/src/shared/api/client"
import { ClientCategory, ClientCategoryListResponse} from "./types"

export const clientCategoriesApi = {
    // 🔹 GET /client-categories/
    list: () =>
        apiFetch<ClientCategoryListResponse>("clients/categories/", {
            method: "GET",
        }),

    // 🔹 GET /client-categories/{id}/
    getById: (id: number) =>
        apiFetch<ClientCategory>(`clients/categories/${id}/`, {
            method: "GET",
        }),

    // 🔹 POST /client-categories/
    create: (data: { name: string; discount: number }) =>
        apiFetch<ClientCategory>("clients/categories/", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    // 🔹 PUT /client-categories/{id}/
    update: (id: number, data: { name: string; discount: number }) =>
        apiFetch<ClientCategory>(`clients/categories/${id}/`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    // 🔹 PATCH /client-categories/{id}/
    partialUpdate: (
        id: number,
        data: Partial<{ name: string; discount: number }>
    ) =>
        apiFetch<ClientCategory>(`clients/categories/${id}/`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    // 🔹 DELETE /client-categories/{id}/
    delete: (id: number) =>
        apiFetch<void>(`clients/categories/${id}/`, {
            method: "DELETE",
        }),
}