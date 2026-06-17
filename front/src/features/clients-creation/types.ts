export interface ClientCategory {
    id: number
    name: string
    discount_percent: number
}

export interface Client {
    id: number
    full_name: string
    email: string | null
    phone_number: string | null
    category: ClientCategory | null
    // Додаткові поля, які приходять з ClientSerializer
    category_name?: string
    discount_percent?: number
    created_at?: string
}

export interface ClientFormData {
    full_name: string
    email: string | null       // Додано | null
    phone_number: string | null // Додано | null
    category: number | null
}

export interface ClientsListResponse {
    count: number
    next: string | null
    previous: string | null
    results: Client[]
}

export interface ClientCategoryFormData {
    name: string
    discount_percent: number
}

export interface ClientCategoriesListResponse {
    count: number
    next: string | null
    previous: string | null
    results: ClientCategory[]
}