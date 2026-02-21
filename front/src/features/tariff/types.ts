

export interface Tariff {
    id: number,
    name: string,
    language_pair: number,
    currency_id: number,
    category: number,
    price_per_page: number,
    price_per_action: number,
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
}

export interface TariffsFormData {
    name: string,
    language_pair: number,
    currency_id: number,
    category: number,
    price_per_page: number,
    price_per_action: number
}