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

    listTariff: () =>
        apiFetch<TariffsListResponse>("orders/order-traffic/", {
            method: "GET",
        }),

    listCategories: () =>
        apiFetch<CategoriesListResponse>("core/order-categories/", {
            method: "GET",
        }),
}