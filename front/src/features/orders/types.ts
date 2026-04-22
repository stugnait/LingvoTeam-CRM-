import {TaskPriority, TaskStatus} from "@/src/features/editor/types";

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
    deadline: Date | undefined,
    priority: string | undefined,
    client_comment: string,
    files?: File[]
    manager_accept_id?: number
    manager_delivery_id?: number
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
    page_count: number
    images_count: number
    chars_with_spaces: number
    chars_no_spaces: number
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
    status_name: string
    created_at: string // ISO
    translator_id: number
    language_pair_id: number
    deadline: string
    priority: "low" | "medium" | "high" | "critical"
    manager_accept_id?: number
    manager_accept_name?: string
    manager_delivery_id?: number
    manager_delivery_name?: string
}

export interface OrderListResponse {
    results: OrderListItem[]
    count: number
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
    translator_traffic_id: number | null
    order_price_per_page: string
    translator_rate_per_page: string | null
    margin_percent: string | null
    margin_label: string | null
    language_pair_label: string
    category_label: string
}

export interface OrderMarginsResponse {
    traffic_id: number
    language_pair_id: number
    currency_id: number
    category_id: number | null
    results: OrderMarginsRow[]
}

export interface EditorsByLanguagePairItem {
  editor_id: number
  editor_name: string | null
  editor_language_pair_id: number | null
  language_pair_label: string
}

export interface EditorsByLanguagePairResponse {
    language_pair: {
        id: number
        source_language_id: number
        target_language_id: number
    }
    count: number
    results: EditorsByLanguagePairItem[]
}

export interface AnalyzeUploadedImageFileResult {
    filename: string
    file_type: string
    ocr_language?: string
    images_found?: number
    detected_symbols_from_images?: number
    preview_text?: string
    error?: string
}

export interface AnalyzeUploadedImagesResponse {
    ocr_language: string
    total_words: string
    total_images_found: number
    total_detected_symbols_from_images: number
    results: AnalyzeUploadedImageFileResult[]
}

export interface KanbanTask {
    id: string

    title: string
    description?: string

    status: TaskStatus
    status_id: number

    priority: TaskPriority

    deadline?: string
    client_id: number

    assignee?: {
        id: number
        name: string
        avatar?: string
    } | null

    tags: string[]
    subtasks: any[] // 🔥 щоб не падало
}

export interface KanbanColumn {
    id: string
    title: string
    status: TaskStatus
    status_id: number
    taskIds: string[]
    color: string
    icon: React.ReactNode
}

// Helper to map status_id to TaskStatus
export const statusIdToTaskStatus = (status_id: number): TaskStatus => {
    const mapping: Record<number, TaskStatus> = {
        1: "planned",
        2: "todo",
        3: "in_progress",
        4: "reject",
        5: "pause",
        6: "done",
    }

    return mapping[status_id] || "todo"
}

export const taskStatusToStatusId = (status: TaskStatus): number => {
    const mapping: Record<TaskStatus, number> = {
        planned: 1,
        todo: 2,
        in_progress: 3,
        reject: 4,
        pause: 5,
        done: 6,
    }

    return mapping[status]
}