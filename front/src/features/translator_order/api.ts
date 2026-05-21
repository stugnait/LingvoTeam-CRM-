import { apiFetch } from "@/src/shared/api/client"
import type {
    CheckExternalOrderResponse,
    ExternalOrderFolder,
    ExternalOrderFilesListResponse,
    ExternalOrderLoginPayload,
    ExternalOrderLoginResponse,
} from "./types"

export const translatorOrderApi = {
    // GET /api/translators/<slug>/
    check: (slug: string) =>
        apiFetch<CheckExternalOrderResponse>(
            `translators/external/${slug}/`,
            {
                method: "GET",
                skipGlobalError: true,
            }
        ),

    // POST /api/translators/<slug>/
    login: (slug: string, payload: ExternalOrderLoginPayload) =>
        apiFetch<ExternalOrderLoginResponse>(
            `translators/external/${slug}/`,
            {
                method: "POST",
                body: JSON.stringify(payload),
                skipGlobalError: true,
            }
        ),

    // В api файлі
    uploadFiles: (formData: FormData) =>
        apiFetch<{ message: string; count: number; files: any[] }>(
            `translators/translator-upload/`,
            {
                method: 'POST',
                body: formData,
            }
        ),

    listDownloadFiles: (orderId: number, folder: ExternalOrderFolder = "source") =>
        apiFetch<ExternalOrderFilesListResponse>(
            `translators/external/orders/${orderId}/download-files/${folder}/?list=1`,
            { method: "GET" }
        ),

    downloadAllFiles: (orderId: number, folder: ExternalOrderFolder = "source") =>
        apiFetch<Blob>(
            `translators/external/orders/${orderId}/download-files/${folder}/`,
            { method: "GET", responseType: "blob" }
        ),

    downloadFile: (orderId: number, folder: ExternalOrderFolder, fileId: number) =>
        apiFetch<Blob>(
            `translators/external/orders/${orderId}/download-files/${folder}/${fileId}/`,
            { method: "GET", responseType: "blob" }
        ),

    completeOrder: (orderId: number) =>
        apiFetch<{ detail: string }>(
            `translators/external/orders/${orderId}/complete/`,
            { method: "POST" }
        ),
}