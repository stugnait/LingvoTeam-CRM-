/* =========================================================
   TRANSLATOR
   ========================================================= */

import {User} from "@/src/features/users/types";

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
