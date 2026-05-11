

export interface Tariff {
    id: number
    name: string
    // language_pair: {
    //     id: number
    //     source_language_name: number
    //     target_language_name: number
    // } | null
    currency_id: number
    category: number
    price_per_page: string
    price_per_action: string
    // read-only поля з бека
    language_pair_name: string
    source_language_name: string
    target_language_name: string
    currency_name: string
    currency_sign: string
    category_name: string
}

export interface TariffsListResponse {
    results: Tariff[]
    total: number
    count: number
}

export interface TariffsFormData {
    name: string
    language_pair_id: number   // ← тепер зберігаємо ID пари напряму
    source_language: number // залишаємо для payload на бек
    target_language: number
    currency_id: number
    category: number
    price_per_page: string
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