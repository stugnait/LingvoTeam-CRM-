export interface ClientCategory {
    id: number
    name: string
    discount: number
}

export interface ClientCategoryListResponse {
    results: ClientCategory[]
}