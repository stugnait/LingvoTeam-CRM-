import { apiFetch } from "@/src/shared/api/client"
import type {
    Translator,
    TranslatorFilters,
    TranslatorPayload,
    TranslatorListResponse
    // UsersQueryParams,
} from "./types"
import type {RegisterPayload, RegisterResponse} from "@/src/features/auth/types";

export const translatorsApi = {
    // GET /translators/?search=&work_type=&source_language=&target_language=
    list: () =>
        apiFetch<TranslatorListResponse>("translators/translators/", {
            method: "GET",
        }),

    // GET /translators/:id/
    getById: (id: number) =>
        apiFetch<Translator>(`translators/${id}/`, {
            method: "GET",
        }),

    // POST /translators/
    create: (data: TranslatorPayload) =>
        apiFetch<Translator>("translators/translators", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    // PATCH /translators/:id/
    update: (id: number, data: Partial<TranslatorPayload>) =>
        apiFetch<Translator>(`translators/${id}/`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    // DELETE /translators/:id/
    remove: (id: number) =>
        apiFetch<void>(`translators/${id}/`, {
            method: "DELETE",
        }),
}

