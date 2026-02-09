// orders/api.ts

import { apiFetch } from "@/src/shared/api/client"
import type { OrderListResponse, OrderListItem } from "./types"

export const ordersApi = {
    // create: (body: BodyInit) =>
    //     apiFetch<CreateOrderResponse>("orders/", {
    //         method: "POST",
    //         body,
    //     }),
    //
    // // GET /translators/?search=&work_type=&source_language=&target_language=
    // list: () =>
    //     apiFetch<TranslatorListResponse>("translators/", {
    //         method: "GET",
    //     }),

    listOrders: () =>
        apiFetch<OrderListResponse>("orders/", {
            method: "GET",
        }),

    getById: (id: number) =>
            apiFetch<OrderListItem>(`orders/${id}/`, {
                method: "GET",
            }),

    // GET /translators/:id/
    // getById: (id: number) =>
    //     apiFetch<Details>(`orders/${id}/`, {
    //         method: "GET",
    //     }),

    // getLanguagePairById: (id: number) =>
    //     apiFetch<LanguagePair>(`core/pairs/${id}/`, {
    //         method: "GET",
    //     }),
    //
    // getTranslatorById: (id: number) =>
    //     apiFetch<Translator>(`translators/${id}`, {
    //         method: "GET",
    //     }),
    // analyzeImages: (orderId: number) =>
    //     apiFetch<AnalyzeImagesResponse>(`orders/${orderId}/analyze-images/`, {
    //         method: "POST",
    //     }),

    updateStatus: (orderId: number, data: { status_id: string }) =>
        apiFetch(`orders/${orderId}/`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    downloadFilesSource: (orderId: number) =>
        apiFetch<Blob>(`orders/${orderId}/download-files/source/`, {
            method: 'GET',
            responseType: 'blob',
        }),

    downloadFilesTarget: (orderId: number) =>
        apiFetch<Blob>(`orders/${orderId}/download-files/target/`, {
            method: 'GET',
            responseType: 'blob',
        }),

    rejectTranslation: (orderId: number, comment?: string) =>
        apiFetch(
            `orders/${orderId}/reject-translation/`,
            {
                method: "POST",
                body: JSON.stringify({
                    review_comment: comment ?? "",
                }),
            }
        ),

    // 🟢 ПРИЙНЯТТЯ + ОЦІНКА
    approveTranslation: (
        orderId: number,
        data: {
            score: number
            comment?: string
        }
    ) =>
        apiFetch(
            `orders/${orderId}/approve-translation/`,
            {
                method: "POST",
                body: JSON.stringify(data),
            }
        ),
}
