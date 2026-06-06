// ── Параметри запиту (список редакторів) ─────────────────────────────────────
export interface EditorStatsParams {
    start_date?: string
    end_date?: string
    search?: string
}

// ── Один рядок редактора (дані з бекенду) ────────────────────────────────────
export interface EditorStatItem {
    id: number
    full_name: string
    total_orders: number
    total_revenue: string | number
    gross_profit: string | number
    avg_margin_percent: string | number
    total_pages: string | number
    total_chars_with?: number
    total_chars_without?: number
}

// ── Деталі одного редактора ───────────────────────────────────────────────────
export interface EditorDetailParams {
    start_date?: string
    end_date?:   string
}

export interface EditorDetailData {
    editor_info: {
        id:        number
        full_name: string
        email:     string
    }
    summary: {
        total_orders:         number
        total_pages:          number
        total_revenue:        string | number
        avg_margin_percent:   string | number
        avg_time_per_page:    number // Середній час на сторінку (в годинах)
    }
    orders_chart: { date: string; count: number }[]
    // Новий графік для відображення часу на сторінку
    time_chart:   { date: string; time_per_page: number }[]
}

// ── Замовлення редактора ──────────────────────────────────────────────────────
export interface EditorOrdersParams {
    editor?:     string // <-- Фільтр по редактору
    start_date?: string
    end_date?:   string
    ordering?:   string
    search?:     string
}

export interface EditorOrder {
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