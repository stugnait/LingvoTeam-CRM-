export interface CreateOrderPayload {
    client_id: number
    source_language: number
    target_language: number
    traffic_id: number
    translator_id?: number
    translator_traffic_id?: number
    files?: File[]
}

export interface CreateOrderResponse {
    message: string
    order_id: number
    stats: {
        physical_pages: number
        chars_with_spaces: number
        chars_no_spaces: number
        images_count: number
    }
    translator_link: {
        full_url: string
        password: string
        expire_at: string
    }
}
