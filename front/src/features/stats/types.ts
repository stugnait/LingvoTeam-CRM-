// -------------------------
// Base / Shared
// -------------------------

export interface PaginatedResponse<T> {
    count: number
    next: string | null
    previous: string | null
    results: T[]
}

// -------------------------
// Owner Orders
// -------------------------

export interface OwnerOrder {
    id: number
    title?: string
    client_comment?: string

    client_id?: number
    manager_id?: number
    translator_id?: number

    status_id: number
    status_name?: string

    deadline: string
    created_at: string

    page_count?: number
    total_amount?: number
}

export type OwnerOrdersResponse = PaginatedResponse<OwnerOrder>

// -------------------------
// Generic Order (Dashboard)
// -------------------------

export interface Order {
    id: number

    client_id?: number
    translator_id?: number
    manager_id?: number

    status_id: number
    status_name?: string

    deadline: string
    created_at: string

    total_amount?: number
    page_count?: number
}

// -------------------------
// Stats (manager/client/translator)
// -------------------------

export interface StatsItem {
    id: number
    full_name: string

    total_orders: number
    total_revenue: number
    unpaid_orders_count: number
}

// -------------------------
// Conversion
// -------------------------

export interface ConversionStats {
    total_requests: number
    accepted_services: number
    refused_services: number
    conversion_percent: number
}

// -------------------------
// Sales Chart
// -------------------------

export interface SalesChartItem {
    date: string // ISO date
    daily_revenue: number
}

// -------------------------
// PnL
// -------------------------

export interface PnLSummary {
    revenue: number
    cogs: number
    gross_profit: number
    gross_margin_percent: number
    opex: number
    net_profit: number
}

export interface PnLBreakdownItem {
    name: string
    val_revenue: number
    val_cost: number
    val_profit: number
}

export interface PnLResponse {
    period: {
        start: string
        end: string
    }
    summary: PnLSummary
    breakdown: PnLBreakdownItem[]
}