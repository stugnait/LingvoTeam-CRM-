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
            `translators/external/${slug}/`,
            {
                method: "GET",
            }
        ),

    // POST /api/translators/<slug>/
    login: (slug: string, payload: ExternalOrderLoginPayload) =>
        apiFetch<ExternalOrderLoginResponse>(
            `translators/external/${slug}/`,
            {
                method: "POST",
                body: JSON.stringify(payload),
            }
        ),
}
