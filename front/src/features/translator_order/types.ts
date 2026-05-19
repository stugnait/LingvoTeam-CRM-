export type ExternalOrderStatus = "awaiting_password" | "granted" | "banned" | "expired" | "wrong_password" | "error"

export interface CheckExternalOrderResponse {
    status: ExternalOrderStatus
    remaining_attempts?: number
    remaining_seconds?: number
    banned_until?: string
    order_data?: ExternalOrder
    message?: string
    error?: string
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
    status_id?: number
}

export interface ExternalOrderLoginResponse {
    status: ExternalOrderStatus
    access?: "granted"
    order_id?: number
    order_data?: ExternalOrder
    remaining_attempts?: number
    remaining_seconds?: number
    banned_until?: string
    message?: string
    error?: string
}

export type ExternalOrderFolder = "source" | "target"

export interface ExternalOrderFileItem {
    id: number
    name: string
}

export interface ExternalOrderFilesListResponse {
    order_id: number
    folder: ExternalOrderFolder
    count: number
    files: ExternalOrderFileItem[]
}
