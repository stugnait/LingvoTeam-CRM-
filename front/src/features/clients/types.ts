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

export interface ExternalOrderFileItem {
    id: number
    name: string
}

export interface ExternalOrderFilesListResponse {
    order_id: number
    folder: "final"
    count: number
    files: ExternalOrderFileItem[]
}
