// ── Вкладена інфо про людину ──────────────────────────────────────────────────
export interface PersonInfo {
    id:        number
    full_name: string
    email?:    string
    phone?:    string
    role?:     number
}

export interface ClientInfo {
    id:           number
    full_name:    string
    email?:       string
    phone_number?: string
    category?:    string
}

export interface TranslatorInfo {
    id:        number
    full_name: string
    email?:    string
    phone?:    string
    work_type?: string
}

export interface LanguagePairInfo {
    id:   number
    name: string  // "Українська → Англійська"
}

// ── Одне замовлення з API ─────────────────────────────────────────────────────
export interface OrderItem {
    id:                       number
    created_at:               string
    deadline:                 string | null
    page_count:               number
    symbols_with_spaces_count: number
    symbols_count:            number
    total_amount:             string
    client_status:            number
    status_id:                number
    client_comment?:          string
    language_pair?:           LanguagePairInfo | null
    tariff_name?:             string | null
    manager_accept?:          PersonInfo | null
    manager_delivery?:        PersonInfo | null
    editor?:                  PersonInfo | null
    client?:                  ClientInfo | null
    translator?:              TranslatorInfo | null
}

// ── Параметри фільтрації ──────────────────────────────────────────────────────
export interface OrdersParams {
    search?:       string   // пошук по ID або client_comment
    client?:       string   // client id
    manager?:      string   // manager id (accept OR delivery)
    translator?:   string
    status?:       string
    start_date?:   string
    end_date?:     string
    ordering?:     string
}