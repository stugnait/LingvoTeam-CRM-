// orders/api.ts

import { apiFetch } from "@/src/shared/api/client"
import {
    Tariff,
    TariffsFormData,
    TariffsListResponse,
    CategoriesListResponse
} from "./types"


export const tariffApi = {
    createTariff: (body: BodyInit) =>
        apiFetch<Tariff>("orders/order-traffic/", {
            method: "POST",
            body,
        }),

    updateTariff: (id: number, body: BodyInit) =>
        apiFetch<Tariff>(`orders/order-traffic/${id}/`, {
            method: "PATCH",
            body,
        }),

    deleteTariff: (id: number) =>
        apiFetch<Tariff>(`orders/order-traffic/${id}/`, {
            method: "DELETE",
        }),

    listTariff: (page: number = 1) =>
        apiFetch<TariffsListResponse>(`orders/order-traffic/?page=${page}`, {
            method: "GET",
        }),

    listCategories: () =>
        apiFetch<CategoriesListResponse>("core/order-categories/", {
            method: "GET",
        }),
}