// orders/api.ts

import { apiFetch } from "@/src/shared/api/client"
import type { CreateOrderResponse, Translator,
    TranslatorFilters,
    TranslatorPayload,
    TranslatorListResponse } from "./types"

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

    // GET /translators/:id/
    getById: (id: number) =>
        apiFetch<Translator>(`translators/${id}/`, {
            method: "GET",
        }),
}
