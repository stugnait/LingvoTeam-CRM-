import { apiFetch } from "@/src/shared/api/client"
import type {
    Client,
    ClientFormData,
    ClientsListResponse,
    ClientCategory,
    ClientCategoryFormData,
    ClientCategoriesListResponse
} from "./types"

export const clientsCreationApi = {

    // GET /clients/
    list: (page: number = 1, search?: string, categoryId?: string) => {
        const params = new URLSearchParams()
        params.append('page', String(page))

        if (search) {
            params.append('search', search)
        }

        if (categoryId && categoryId !== "all") {
            params.append('category', categoryId)
        }

        return apiFetch<ClientsListResponse>(`clients/?${params.toString()}`, {
            method: "GET",
        })
    },

    // GET /clients/:id/
    getById: (id: string) =>
        apiFetch<Client>(`clients/${id}/`, {
            method: "GET",
        }),

    // POST /clients/
    create: (data: ClientFormData) =>
        apiFetch<Client>("clients/", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    // PATCH /clients/:id/
    update: (id: number, data: ClientFormData) =>
        apiFetch<Client>(`clients/${id}/`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    // DELETE /clients/:id/
    remove: (id: number) =>
        apiFetch<void>(`clients/${id}/`, {
            method: "DELETE",
        }),

    // ========================
    // CLIENT CATEGORIES
    // ========================

    // GET /client-categories/
    listCategories: (pageNumber: number, debouncedSearch: string) =>
        apiFetch<ClientCategoriesListResponse>("clients/categories/", {
            method: "GET",
        }),

    // POST /client-categories/
    createCategory: (data: ClientCategoryFormData) =>
        apiFetch<ClientCategory>("clients/categories/", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    deleteCategory: (id: number) =>
        apiFetch<void>(`clients/categories/${id}/`, {
            method: "DELETE",
        }),

    updateCategory: (id: number, data: ClientCategoryFormData) =>
        apiFetch<ClientCategory>(`clients/categories/${id}/`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    importExcel: (file: File) => {
        const formData = new FormData()
        formData.append("file", file)

        return apiFetch<{ message: string }>("clients/import_excel/", {
            method: "POST",
            body: formData as never, // Не робимо JSON.stringify!
            // Браузер сам встановить Content-Type: multipart/form-data
        })
    },
}