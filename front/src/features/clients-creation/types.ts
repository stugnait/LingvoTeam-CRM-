export interface ClientCategory {
    id: number
    name: string
    discount: number
}

export interface Client {
    id: number
    full_name: string
    email: string
    phone_number?: string
    category: ClientCategory
}

export interface ClientFormData {
    name: string
    email: string
    phone?: string
    category: number
}

export interface ClientsListResponse {
    count: number
    next: string | null
    previous: string | null
    results: Client[]
}

export interface ClientCategoryFormData {
    name: string
    discount: number
}

export interface ClientCategoriesListResponse {
    count: number
    next: string | null
    previous: string | null
    results: ClientCategory[]
}