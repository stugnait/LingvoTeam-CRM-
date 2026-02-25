export interface CreateOrderPayload {
    client_id: number
    source_language: number
    target_language: number
    traffic_id: number
    language_pair_id: number
    editor_id: number,
    currency_id_id: number,
    translator_id?: number
    translator_traffic_id?: number
    files?: File[]
}

export interface CreateOrderResponse {
    message: string
    order_id: number
    page_count: number
    chars_with_spaces: number
    chars_no_spaces: number
    images_count: number

    full_url: string
    password: string
    expire_at: string
}

export interface Details {
    translator_id: number
    client_id: number
}

/* =========================================================
   TRANSLATOR
   ========================================================= */

import { User } from "@/src/features/users/types";

/**
 * Відповідає TranslatorSerializer
 */
export interface Translator {
    id: number
    full_name: string
    email: string
    phone: string
    work_type: string

    currency_id: number
    currency_name: string

    created_at: string // ISO datetime
}

export interface Client {
    id: number
    full_name: string
    email: string
    phone_number: string
    category: string

    category_name: number

    created_at: string
}

export interface ClientListResponse {
    results: Client[]
    total: number
}

export interface Language {
    id: number
    name: string
    slug: string
}

export interface LanguageListResponse {
    results: Language[]
    total: number
}

export interface Editor {
    id: number
    email: number
    phone: number,
    full_name: string,
    is_active: boolean
}

export interface EditorListResponse {
    results: Editor[]
    total: number
}

export interface Currency {
    id: number,
    code: string,
    name: string,
    code_name: string,
}

export interface CurrencyListResponse {
    results: Currency[]
    total: number
}

/* =========================================================
   TRANSLATOR — CREATE / UPDATE PAYLOAD
   ========================================================= */

export interface TranslatorPayload {
    full_name: string
    email: string
    phone: string
    work_type: string
    currency_id?: number
}

export interface TranslatorListResponse {
    results: Translator[]
    total: number
}

/* =========================================================
   TRANSLATOR FILTERS (query params)
   ========================================================= */

export interface TranslatorFilters {
    work_type?: number
    source_language?: number
    target_language?: number
    search?: string
}

/* =========================================================
   TRANSLATOR TRAFFIC
   ========================================================= */

/**
 * Відповідає TranslatorTrafficSerializer
 */
export interface TranslatorTraffic {
    id: number

    translator_id: number
    language_pair: number
    language_pair_name: string

    currency_id: number
    currency_name: string

    rate_per_page?: number | null
    rate_per_action?: number | null
}

/* =========================================================
   TRANSLATOR TRAFFIC — CREATE / UPDATE PAYLOAD
   ========================================================= */

export interface TranslatorTrafficPayload {
    translator_id: number
    language_pair: number
    currency_id: number

    rate_per_page?: number | null
    rate_per_action?: number | null
}


/* =========================================================
   COMMON API RESPONSES
   ========================================================= */

// DRF validation error (400)
export type ValidationErrorResponse = {
    [field: string]: string[]
}

// 401 Unauthorized
export interface AuthErrorResponse {
    detail: string
}

// 403 Forbidden
export interface PermissionErrorResponse {
    detail: string
}


export interface OrderListItem {
    id: number
    client_id: number
    source_language: number
    target_language: number
    status_id: number
    created_at: string // ISO
    translator_id: string
    language_pair_id: number
}

export interface OrderListResponse {
    results: OrderListItem[]
    total: number
}

export interface LanguagePair {
    id: number
    pair_name: string
}

export interface FileStats {
    chars_with_spaces: number
    chars_no_spaces: number
    images: number
    pages: number
}

export interface CalculateStatsResponse {
    total_stats: {
        chars_with_spaces: number
        chars_no_spaces: number
        images: number
        physical_pages: number
    }
    files: {
        filename: string
        stats: FileStats
    }[]
}

export interface AnalyzeImageFileResult {
    file_id: number
    file_type: string
    images_found: number
    detected_symbols_from_images: number
    preview_text: string
    error?: string
}

export interface AnalyzeImagesResponse {
    order_id: number
    results: AnalyzeImageFileResult[]
}

export interface OrderTraffic {
    id: number
    language_pair: number,
    language_pair_name: string,
    currency_id: number,
    currency_name: string,
    category: number,
    category_name: string,
    price_per_page: number
}

export interface OrderTrafficListResponse {
    results: OrderTraffic[]
    total?: number
}

export interface TranslatorTraffic {
    id: number
    translator_id: number
    language_pair_id: number
    currency_id_id: number
    category_id?: number | null
    rate_per_page?: number | null
    rate_per_action?: number | null
}

export interface TranslatorTrafficListResponse {
    results: TranslatorTraffic[]
    total?: number
}

export interface OrderMarginsRow {
    translator_id: number
    translator_name: string | null
    translator_traffic_id: number
    order_price_per_page: string
    translator_rate_per_page: string
    margin_percent: string
    margin_label: string
}

export interface OrderMarginsResponse {
    traffic_id: number
    language_pair_id: number
    currency_id: number
    category_id: number | null
    results: OrderMarginsRow[]
}
