// orders/api.ts

import { apiFetch } from "@/src/shared/api/client"
import type { CreateOrderResponse } from "./types"

export const ordersApi = {
    create: (body: BodyInit) =>
        apiFetch<CreateOrderResponse>("orders/", {
            method: "POST",
            body,
        }),
}
