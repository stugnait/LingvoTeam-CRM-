import { apiFetch } from "@/src/shared/api/client"
import type {
    Translator,
    TranslatorFilters,
    TranslatorPayload,
    TranslatorListResponse, TranslatorTraffic, TranslatorTrafficPayload
} from "./types"

export const translatorsApi = {

    // GET /translators/?search=
    list: (page: number = 1, params?: { search?: string }) => {

        const query = new URLSearchParams()
        query.append("page", String(page))

        if (params?.search) {
            query.append("search", params.search)
        }

        const qs = query.toString()
        const url = `translators/?${qs}`

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

    createTranslatorTraffic: (data: TranslatorTrafficPayload) =>
        apiFetch<TranslatorTraffic>(
            "translatortraffic/",
            {
                method: "POST",
                body: JSON.stringify(data),
            }
        ),

    // PATCH /translatortraffic/:id/
    updateTranslatorTraffic: (id: number, data: Partial<TranslatorTrafficPayload>) =>
        apiFetch<TranslatorTraffic>(
            `translatortraffic/${id}/`,
            {
                method: "PATCH",
                body: JSON.stringify(data),
            }
        ),

    // DELETE /translatortraffic/:id/
    removeTranslatorTraffic: (id: number) =>
        apiFetch<void>(
            `translatortraffic/${id}/`,
            {
                method: "DELETE",
            }
        ),
}