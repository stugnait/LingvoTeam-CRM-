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
    list: (page: number = 1, search?: string) =>
        apiFetch<ClientsListResponse>(`clients/?page=${page}&search=${search ?? ""}`, {
            method: "GET",
        }),

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
}