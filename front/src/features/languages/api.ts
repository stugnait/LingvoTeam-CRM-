import type {Language, LanguageListResponse} from "./types";
import {apiFetch} from "@/src/shared/api/client";


export const languagesApi = {
    list: (page: number = 1, search: string = "") =>
        apiFetch<LanguageListResponse>(
            `core/languages/?page=${page}${search ? `&search=${encodeURIComponent(search)}` : ""}`,
            { method: "GET" }
        ),


    create: (data: { name: string; slug: string }) =>
        apiFetch<Language>(`core/languages/`, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    delete: (id: number) => apiFetch<void>(`core/languages/${id}/`, { method: "DELETE" }),
};