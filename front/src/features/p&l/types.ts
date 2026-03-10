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
    created_at: string
    currency: number
    category: number
}

export interface TransactionFormData {
    amount: number
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