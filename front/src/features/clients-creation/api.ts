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
    list: (search?: string) =>
        apiFetch<ClientsListResponse>(`clients/?search=${search ?? ""}`, {
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
    listCategories: () =>
        apiFetch<ClientCategoriesListResponse>("clients/categories/", {
            method: "GET",
        }),

    // POST /client-categories/
    createCategory: (data: ClientCategoryFormData) =>
        apiFetch<ClientCategory>("client-categories/", {
            method: "POST",
            body: JSON.stringify(data),
        }),
}