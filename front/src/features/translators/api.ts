import { apiFetch } from "@/src/shared/api/client"
import type {
    Translator,
    TranslatorPayload,
    TranslatorListResponse,
    TranslatorTraffic,
    TranslatorTrafficPayload
} from "./types"
import type {CurrencyListResponse} from "@/src/features/orders/types";

export const translatorsApi = {
    list: (page: number = 1, params?: {
        search?: string
        ordering?: "orders_count" | "-orders_count" | "created_at" | "-created_at"
        source_language?: number | null
        target_language?: number | null
        language_pair_id?: number | null
    }) => {

        const query = new URLSearchParams()

        query.append("page", String(page))

        if (params?.search) {
            query.append("search", params.search)
        }

        if (params?.ordering) {
            query.append("ordering", params.ordering)
        }

        if (params?.source_language !== undefined && params?.source_language !== null) {
            query.append("source_language", String(params.source_language))
        }

        if (params?.target_language !== undefined && params?.target_language !== null) {
            query.append("target_language", String(params.target_language))
        }

        if (params?.language_pair_id !== undefined && params?.language_pair_id !== null) {
            query.append("language_pair_id", String(params.language_pair_id))
        }

        const qs = query.toString()
        const url = `translators/?${qs}`

        return apiFetch<TranslatorListResponse>(url, {
            method: "GET",
        })
    },

    getById: (id: number) =>
        apiFetch<Translator>(`translators/${id}/`, {
            method: "GET",
        }),

    create: (data: TranslatorPayload) =>
        apiFetch<Translator>("translators/", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    update: (id: number, data: Partial<TranslatorPayload>) =>
        apiFetch<Translator>(`translators/${id}/`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    listCurrency: () =>
        apiFetch<CurrencyListResponse>(`core/currencies/`, {
            method: "GET"
        }),

    remove: (id: number) =>
        apiFetch<void>(`translators/${id}/`, {
            method: "DELETE",
        }),

    // --- TRAFFIC ---
    listTranslatorTraffic: () =>
        apiFetch<{results: TranslatorTraffic[]} | TranslatorTraffic[]>("translators/translator-traffic/", {
            method: "GET",
        }),

    createTranslatorTraffic: (data: TranslatorTrafficPayload) =>
        apiFetch<TranslatorTraffic>("translators/translator-traffic/", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    updateTranslatorTraffic: (id: number, data: Partial<TranslatorTrafficPayload>) =>
        apiFetch<TranslatorTraffic>(`translators/translator-traffic/${id}/`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    removeTranslatorTraffic: (id: number) =>
        apiFetch<void>(`translators/translator-traffic/${id}/`, {
            method: "DELETE",
        }),

    // --- HELPERS FOR SELECTS ---

    // Отримуємо список всіх мов (щоб перекласти ID в назви)
    listLanguages: () =>
        apiFetch<{ results: any[] }>("core/languages/", {
            method: "GET"
        }),

    // Отримуємо мовні пари
    listLanguagePairs: () =>
        apiFetch<{ results: any[] }>("core/pairs/", {
            method: "GET"
        }),

    // Отримуємо категорії
    listCategories: () =>
        apiFetch<{ results: any[] }>("core/order-categories/", {
            method: "GET"
        }),
}