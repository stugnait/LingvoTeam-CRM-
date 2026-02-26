import { apiFetch } from "@/src/shared/api/client"
import type {
    CheckExternalOrderResponse,
    ExternalOrderLoginPayload,
    ExternalOrderLoginResponse,
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

    // В api файлі
    downloadFiles: (order_id: number) =>
        apiFetch<Blob>(
            `clients/external/orders/${order_id}/download-files/`,
            {
                method: "GET",
            }
        ),

}
