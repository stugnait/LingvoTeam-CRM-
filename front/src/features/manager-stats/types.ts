// ── Параметри запиту (список менеджерів) ─────────────────────────────────────
export interface ManagerStatsParams {
    start_date?: string
    end_date?:   string
    search?:     string
}

// ── Один рядок таблиці (список менеджерів) ───────────────────────────────────
export interface ManagerStatItem {
    id:                   number
    full_name:            string
    total_orders:         number
    total_clients:        number
    total_revenue:        string
    avg_order_value:      string
    avg_margin_percent:   string
    overdue_orders_count: number
}

// ── Деталі менеджера ──────────────────────────────────────────────────────────
export interface ManagerDetailParams {
    start_date?: string
    end_date?:   string
}

export interface ManagerDetailData {
    manager_info: {
        id:        number
        full_name: string
        email:     string
    }
    summary: {
        total_orders:         number
        total_clients:        number
        total_revenue:        string | number
        avg_order_value:      string | number
        avg_margin_percent:   string | number
        overdue_orders_count: number
    }
    orders_chart:  { date: string; count: number }[]
    revenue_chart: { date: string; amount: string | number }[]
}

// ── Замовлення менеджера ──────────────────────────────────────────────────────
export interface ManagerOrdersParams {
    manager?:    string
    start_date?: string
    end_date?:   string
    ordering?:   string
    search?:     string
}

export interface ManagerOrder {
    id:              number
    title:           string
    created_at:      string
    deadline:        string
    total_amount:    string
    page_count:      number
    client_comment?: string
    status?:         { id: number; name: string }
    client?:         { id: number; full_name: string }
    translator?:     { id: number; full_name: string } | null
}