// orders/api.ts

import { apiFetch } from "@/src/shared/api/client"
import type { CreateOrderResponse, Translator,
    TranslatorFilters,
    TranslatorPayload,
    TranslatorListResponse, OrderListResponse } from "./types"

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
        apiFetch<CreateOrderResponse>(`orders/${id}/`, {
            method: "GET",
        }),
}
