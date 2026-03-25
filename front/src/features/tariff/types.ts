

export interface Tariff {
    id: number,
    name: string,
    language_pair: number,
    currency_id: number,
    category: number,
    price_per_page: string,
    price_per_action: string,
    language_pair_name: string,
    source_language: string,
    target_language: string,
    currency_name: string,
    currency_sign: string,
    category_name: string
}

export interface TariffsListResponse {
    results: Tariff[]
    total: number
    count: number
}

export interface TariffsFormData {
    name: string,
    language_pair: number,
    currency_id: number,
    category: number,
    price_per_page: string,
    price_per_action: string
}

export interface Categories {
    id: number,
    name: string,
    slug: string,
}

export interface CategoriesListResponse {
    results: Categories[],
    total: number,
}