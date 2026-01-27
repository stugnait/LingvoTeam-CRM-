// orders/api.ts

import { apiFetch } from "@/src/shared/api/client"
import type { CreateOrderResponse, Translator,
    TranslatorFilters,
    TranslatorPayload,
    Details,
    TranslatorListResponse, OrderListResponse, LanguagePair, AnalyzeImagesResponse } from "./types"

export const ordersApi = {
    create: (body: BodyInit) =>
        apiFetch<CreateOrderResponse>("orders/", {
            method: "POST",
            body,
        }),

    // GET /translators/?search=&work_type=&source_language=&target_language=
    list: () =>
        apiFetch<TranslatorListResponse>("translators/", {
            method: "GET",
        }),

    listOrders: () =>
        apiFetch<OrderListResponse>("orders/", {
            method: "GET",
        }),

    // GET /translators/:id/
    getById: (id: number) =>
        apiFetch<Details>(`orders/${id}/`, {
            method: "GET",
        }),

    getLanguagePairById: (id: number) =>
        apiFetch<LanguagePair>(`core/pairs/${id}/`, {
            method: "GET",
        }),

    getTranslatorById: (id: number) =>
        apiFetch<Translator>(`translators/${id}`, {
            method: "GET",
        }),
    analyzeImages: (orderId: number) =>
        apiFetch<AnalyzeImagesResponse>(`orders/${orderId}/analyze-images/`, {
            method: "POST",
        }),
}
