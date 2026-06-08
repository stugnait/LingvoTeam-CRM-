// ── Параметри запиту (список перекладачів) ────────────────────────────────────
export type TranslatorStatsParams = {
    start_date?: string
    end_date?:   string
    search?:     string
}

// ── Один рядок таблиці (список перекладачів) ─────────────────────────────────
// Бек повертає: id, full_name, total_orders, total_revenue, avg_rating, revision_count
// Додати на бек: avg_margin_percent, total_payout
export interface TranslatorStatItem {
    id:                 number
    full_name:          string
    total_orders:       number
    total_revenue:      string  // виручка по замовленням перекладача
    avg_rating:         number
    revision_count:     number
    avg_margin_percent: string  // додати на бек
    total_payout:       string  // виплати перекладачу (сторінки * rate) — додати на бек
}

// ── Деталі перекладача ────────────────────────────────────────────────────────
export type TranslatorDetailParams = {
    start_date?: string
    end_date?:   string
}

export interface TranslatorDetailData {
    translator_info: {
        id:        number
        full_name: string
        email:     string
        rating:    number
    }
    summary: {
        total_orders:       number
        total_revenue:      string | number
        avg_order_value:    string | number
        avg_margin_percent: string | number
        revision_count:     number
    }
    orders_chart:  { date: string; count: number }[]
    revenue_chart: { date: string; amount: string | number }[]
}

// ── Параметри для списку замовлень ────────────────────────────────────────────
export type TranslatorOrdersParams = {
    translator?: string
    start_date?: string
    end_date?:   string
    search?:     string
}

// ── Замовлення перекладача (реальна структура з бека) ─────────────────────────
export interface TranslatorOrder {
    id:              number
    created_at:      string
    deadline:        string
    page_count:      number
    client_status:   number
    status_id:       number
    client_comment?: string
}