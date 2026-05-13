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
    status_id?: number;
}

export interface ExternalOrderLoginResponse {
    access: "granted"
    order_data: ExternalOrder
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
