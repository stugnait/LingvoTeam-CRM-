import { apiFetch } from "@/src/shared/api/client"
import type {
    CheckExternalOrderResponse,
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
}
