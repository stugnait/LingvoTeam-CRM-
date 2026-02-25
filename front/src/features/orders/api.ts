// orders/api.ts

import { apiFetch } from "@/src/shared/api/client"
import {
    CreateOrderResponse,
    Translator,
    TranslatorFilters,
    TranslatorPayload,
    Details,
    TranslatorListResponse,
    OrderListResponse,
    LanguagePair,
    AnalyzeImagesResponse,
    OrderTraffic,
    OrderTrafficListResponse,
    TranslatorTrafficListResponse,
    OrderMarginsResponse,
    Client,
    Language,
    Editor,
    Currency, ClientListResponse, LanguageListResponse, EditorListResponse, CurrencyListResponse, CalculateStatsResponse
} from "./types"


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
    getOrderMargins: (trafficId: number) =>
        apiFetch<OrderMarginsResponse>(`orders/margins/?traffic_id=${trafficId}`, {
            method: "GET",
        }),
    listClients: () =>
        apiFetch<ClientListResponse>(`clients/`, {
            method: "GET"
        }),
    listLanguages: () =>
        apiFetch<LanguageListResponse>(`core/languages/`, {
            method: "GET"
        }),
    listEditors: () =>
        apiFetch<EditorListResponse>(`users/users/?role=2`, {
            method: "GET"
        }),
    listCurrency: () =>
        apiFetch<CurrencyListResponse>(`core/currencies/`, {
            method: "GET"
        }),
    listTraffic: () =>
        apiFetch<OrderTrafficListResponse>(`orders/order-traffic/`, {
            method: "GET"
        }),
    calculateStats: (files: File[]) => {
        const formData = new FormData()
        files.forEach(file => formData.append("files", file))

        return apiFetch<CalculateStatsResponse>(
            "orders/calculate-stats/",
            {
                method: "POST",
                body: formData,
            }
        )
    },
    analyzeOrderFiles: (orderId: number) =>
        apiFetch<AnalyzeImagesResponse>(
            `orders/${orderId}/analyze-images/`,
            {
                method: "POST",
            }
        ),

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

    confirmOrder: (orderId: number) =>
        apiFetch<{ message: string; slug: string }>(
            `orders/${orderId}/confirm-order/`,
            {
                method: "GET",
            }
        ),
}