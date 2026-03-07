export interface CheckExternalOrderResponse {
    status: "awaiting_password"
}

export interface ExternalOrderLoginPayload {
    password: string
}

export interface ExternalOrder {
    id: number
    language_pair: string
    deadline: string
    comment: string
    status: string
}

export interface ExternalOrderLoginResponse {
    access: "granted"
    order_data: ExternalOrder
}
