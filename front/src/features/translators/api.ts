import { apiFetch } from "@/src/shared/api/client"
import type {
    Translator,
    TranslatorFilters,
    TranslatorPayload,
    TranslatorListResponse
} from "./types"

export const translatorsApi = {

    // GET /translators/?search=
    list: (params?: { search?: string }) => {

        const query = new URLSearchParams()

        if (params?.search) {
            query.append("search", params.search)
        }

        const qs = query.toString()
        const url = qs ? `translators/?${qs}` : "translators/"

        return apiFetch<TranslatorListResponse>(url, {
            method: "GET",
        })
    },

    // GET /translators/:id/
    getById: (id: number) =>
        apiFetch<Translator>(`translators/${id}/`, {
            method: "GET",
        }),

    // POST /translators/
    create: (data: TranslatorPayload) =>
        apiFetch<Translator>("translators/", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    // PATCH /translators/:id/
    update: (id: number, data: Partial<TranslatorPayload>) =>
        apiFetch<Translator>(`translators/${id}/`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    // DELETE /translators/:id/
    remove: (id: number) =>
        apiFetch<void>(`translators/${id}/`, {
            method: "DELETE",
        }),
}