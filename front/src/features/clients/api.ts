import { apiFetch } from "@/src/shared/api/client"
import type {
    CheckExternalOrderResponse,
    ExternalOrderLoginPayload,
    ExternalOrderLoginResponse,
    ExternalOrderFilesListResponse,
} from "./types"

export const clientApi = {
    // GET /api/translators/<slug>/
    check: (slug: string) =>
        apiFetch<CheckExternalOrderResponse>(
            `clients/${slug}/`,
            {
                method: "GET",
            }
        ),

    // POST /api/translators/<slug>/
    login: (slug: string, payload: ExternalOrderLoginPayload) =>
        apiFetch<ExternalOrderLoginResponse>(
            `clients/${slug}/`,
            {
                method: "POST",
                body: JSON.stringify(payload),
            }
        ),

    listDownloadFiles: (order_id: number) =>
        apiFetch<ExternalOrderFilesListResponse>(
            `clients/external/orders/${order_id}/download-files/?list=1&folder=final`,
            { method: "GET" }
        ),

    downloadFiles: (order_id: number) =>
        apiFetch<Blob>(
            `clients/external/orders/${order_id}/download-files/?folder=final`,
            {
                method: "GET",
                responseType: 'blob',
            }
        ),

    downloadFile: (order_id: number, file_id: number) =>
        apiFetch<Blob>(
            `clients/external/orders/${order_id}/download-files/${file_id}/?folder=final`,
            {
                method: "GET",
                responseType: "blob",
            }
        ),
}
