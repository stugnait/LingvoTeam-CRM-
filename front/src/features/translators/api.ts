import { apiFetch } from "@/src/shared/api/client"
import type {
    Translator,
    TranslatorPayload,
    TranslatorListResponse,
    TranslatorTraffic,
    TranslatorTrafficPayload
} from "./types"

export const translatorsApi = {
    // Додано page як перший аргумент, щоб String(page) не викликав помилку
    list: (page: number = 1, params?: {
        search?: string
        ordering?: "orders_count" | "-orders_count" | "created_at" | "-created_at"
        source_language?: number
        target_language?: number
        language_pair_id?: number
    }) => {

        const query = new URLSearchParams()

        // Тепер змінна page визначена через аргументи функції
        query.append("page", String(page))

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
        apiFetch<TranslatorTraffic>("translatortraffic/", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    // PATCH /translatortraffic/:id/
    updateTranslatorTraffic: (id: number, data: Partial<TranslatorTrafficPayload>) =>
        apiFetch<TranslatorTraffic>(`translatortraffic/${id}/`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    // DELETE /translatortraffic/:id/
    removeTranslatorTraffic: (id: number) =>
        apiFetch<void>(`translatortraffic/${id}/`, {
            method: "DELETE",
        }),
}