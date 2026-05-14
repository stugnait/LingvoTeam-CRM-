/* =========================================================
   TRANSLATOR
   ========================================================= */

export interface TranslatorTraffic {
    id: number
    name: string | null

    translator: number
    translator_name: string

    language_pair: number
    language_pair_name: string

    source_language: string
    target_language: string

    category: number | null
    category_name: string | null

    currency_id: number
    currency_name: string
    currency_sign: string

    rate_per_page: number
    rate_per_action: number
}

export interface Translator {
    id: number
    full_name: string
    email: string
    phone: string
    work_type: string

    currency_id: number
    currency_name: string

    traffic: TranslatorTraffic[]

    created_at: string // ISO datetime
    orders_count: number
}

/* =========================================================
   TRANSLATOR — CREATE / UPDATE PAYLOAD
   ========================================================= */

export interface TranslatorPayload {
    full_name: string
    email: string
    phone: string
    work_type: number
    currency_id?: number
}

export interface TranslatorListResponse {
    results: Translator[]
    total: number
    count: number
}

/* =========================================================
   TRANSLATOR FILTERS (query params)
   ========================================================= */

export interface TranslatorFilters {
    work_type?: number
    source_language?: number | null
    target_language?: number | null
    language_pair_id?: number | null
    search?: string
}

/* =========================================================
   TRANSLATOR TRAFFIC — CREATE / UPDATE PAYLOAD
   ========================================================= */

export interface TranslatorTrafficPayload {
    name: string
    translator: number
    language_pair: number | null
    category: number | null
    currency_id: number
    rate_per_page: number
    rate_per_action: number
}

/* =========================================================
   HELPERS FOR SELECTS
   ========================================================= */

export interface LanguagePairOption {
    id: number
    name: string
}

export interface CategoryOption {
    id: number
    name: string
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