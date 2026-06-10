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
    Currency, ClientListResponse, LanguageListResponse, EditorListResponse, CurrencyListResponse, CalculateStatsResponse, EditorsByLanguagePairResponse,
    AnalyzeUploadedImagesResponse
} from "./types"
import type {ExternalOrderFilesListResponse, ExternalOrderFolder} from "@/src/features/translator_order/types";


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

    listDownloadFiles: (orderId: number, folder: "source" | "target" = "source") =>
        apiFetch<{ files: { id: number; name: string }[]; count: number }>(
            `orders/${orderId}/download-files/${folder}/?list=1`, // Змінено тут
            { method: "GET" }
        ),

    downloadAllFiles: (orderId: number, folder: "source" | "target" = "source") =>
        apiFetch<Blob>(
            `orders/${orderId}/download-files/${folder}/`, // Змінено тут
            { method: "GET", responseType: "blob" }
        ),

    downloadFile: (orderId: number, folder: "source" | "target", fileId: number) =>
        apiFetch<Blob>(
            `orders/${orderId}/download-files/${folder}/${fileId}/`, // Змінено тут
            { method: "GET", responseType: "blob" }
        ),

    // Додаємо параметр onlyMine
    listOrders: (filters: {
        page?: number;
        my_orders?: boolean;
        status?: number | string;
        manager?: number | string;
        date_from?: string;
        date_to?: string;
        search?: string; // 👈 ДОДАНО
    } = { page: 1 }) => {
        const params = new URLSearchParams();

        if (filters.page) {params.append('page', String(filters.page));}
        if (filters.my_orders) {params.append('my_orders', 'true');}
        if (filters.status) {params.append('status', String(filters.status));}
        if (filters.manager) {params.append('manager', String(filters.manager));}
        if (filters.date_from) {params.append('date_from', filters.date_from);}
        if (filters.date_to) {params.append('date_to', filters.date_to);}
        if (filters.search) {params.append('search', filters.search);} // 👈 ДОДАНО

        const query = params.toString();
        return apiFetch<OrderListResponse>(`orders/?${query}`, {
            method: "GET",
        });
    },

    previewPrice: (body: BodyInit) =>
        apiFetch<{
            total_price: number
            client_price: number
            translator_price: number
            margin: number
        }>("orders/calculate-full/", {
            method: "POST",
            body,
        }),

    deleteOrder: (id: number) =>
        apiFetch<void>(`orders/${id}/`, {
            method: "DELETE"
        }),

    updateOrder: (id: number, body: BodyInit) =>
        apiFetch<CreateOrderResponse>(`orders/${id}/`, {
            method: "PATCH",
            body
        }),

    updateClientStatus: (id: number, clientStatusId: number) =>
        apiFetch<{ message: string; client_status: any }>(`orders/${id}/update-client-status/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ client_status_id: clientStatusId }),
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
    listManagers: () =>
        apiFetch<EditorListResponse>(`users/users/?role=1`, {
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
    getEditorsByLanguagePair: (sourceLanguageId: number, targetLanguageId: number) =>
        apiFetch<EditorsByLanguagePairResponse>(
            `orders/editors-by-language-pair/?source_language_id=${sourceLanguageId}&target_language_id=${targetLanguageId}`,
            { method: "GET" }
        ),
    analyzeUploadedImages: (files: File[], sourceLanguageId?: number) => {
        const formData = new FormData()
        files.forEach((file) => formData.append("files", file))
        if (sourceLanguageId) {formData.append("source_language_id", String(sourceLanguageId))}

        return apiFetch<AnalyzeUploadedImagesResponse>(
            "orders/analyze-uploaded-images/",
            {
            method: "POST",
            body: formData,
            }
        )
    },
}