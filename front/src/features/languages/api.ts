import type {Language, LanguageListResponse} from "./types";
import {apiFetch} from "@/src/shared/api/client";


export const languagesApi = {
    list: (page: number = 1) =>
        apiFetch<LanguageListResponse>(`core/languages/?page=${page}`, {
            method: "Get",
        }),


    create: (data: { name: string; slug: string }) =>
        apiFetch<Language>(`core/languages/`, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    delete: (id: number) => apiFetch<void>(`core/languages/${id}/`, { method: "DELETE" }),
};