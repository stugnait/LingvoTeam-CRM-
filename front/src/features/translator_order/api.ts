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
            `translators/${slug}/`,
            {
                method: "GET",
            }
        ),

    // POST /api/translators/<slug>/
    login: (slug: string, payload: ExternalOrderLoginPayload) =>
        apiFetch<ExternalOrderLoginResponse>(
            `translators/${slug}/`,
            {
                method: "POST",
                body: JSON.stringify(payload),
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

    downloadAllSourceUrl: (orderId: number) =>
        `/api/translators/external/orders/${orderId}/download-files/source/`,

    downloadSourceFileUrl: (orderId: number, fileId: number) =>
        `/api/translators/external/orders/${orderId}/download-files/source/${fileId}/`,
}

