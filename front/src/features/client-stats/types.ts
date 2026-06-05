// ─────────────────────────────────────────────
// Список клієнтів (таблиця)
// ─────────────────────────────────────────────
export interface ClientStatItem {
    id: number
    full_name: string
    total_orders: number
    total_revenue: string
    avg_order_value: string
    unpaid_orders_count: number
}

export interface ClientStatsParams {
    start_date?: string   // YYYY-MM-DD
    end_date?: string
}

// ─────────────────────────────────────────────
// Детальна сторінка клієнта
// ─────────────────────────────────────────────
export interface ClientInfo {
    id: number
    full_name: string
    email: string
}

export interface OrdersChartPoint {
    date: string    // "2025-01-01"
    count: number
}

export interface RevenueChartPoint {
    date: string
    amount: string  // Decimal → рядок
}

export interface LanguagePairPoint {
    pair_name: string
    count: number
}

export interface ClientDetailData {
    client_info: ClientInfo
    orders_chart: OrdersChartPoint[]
    revenue_chart: RevenueChartPoint[]
    language_pairs: LanguagePairPoint[]
}

export interface ClientDetailParams {
    start_date?: string
    end_date?: string
}