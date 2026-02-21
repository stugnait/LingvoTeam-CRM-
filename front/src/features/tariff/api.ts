// orders/api.ts

import { apiFetch } from "@/src/shared/api/client"
import {
    Tariff,
    TariffsFormData,
    TariffsListResponse
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

    listTariff: () =>
        apiFetch<TariffsListResponse>("orders/order-traffic/", {
            method: "GET",
        }),
}