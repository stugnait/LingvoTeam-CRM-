export type TransactionType = "income" | "expense" | null

export interface TransactionCategory {
    id: number
    name: string
    slug: string
    type: TransactionType
}

export interface Transaction {
    id: number
    amount: number
    type: TransactionType
    comment: string
    created_at: string | null
    currency: number
    category: number
}

export interface TransactionFormData {
    amount: number
    created_at: string | null
    type: TransactionType
    comment: string
    currency: number
    category: number
}

export interface TransactionPayload {
    amount: number
    type: TransactionType
    comment?: string
    currency: number
    category: number
}

export interface TransactionListResponse {
    results: Transaction[]
}

export interface TransactionCategoryPayload {
    name: string
    type: TransactionType
}

export interface TransactionCategoryListResponse {
    results: TransactionCategory[]
}

export interface PnLSummary {
    revenue: number
    cogs: number
    gross_profit: number
    gross_margin_percent: number
    opex: number
    net_profit: number
}

export interface PnLResponse {
    period: {
        start: string
        end: string
    }
    summary: PnLSummary
    breakdown: {
        name: string
        val_revenue: number
        val_cost: number
        val_profit: number
    }[]
}