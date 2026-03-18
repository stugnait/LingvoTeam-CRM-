import { apiFetch } from "@/src/shared/api/client"
import {
    Transaction,
    TransactionPayload,
    TransactionListResponse,
    TransactionCategory,
    TransactionCategoryPayload,
    TransactionCategoryListResponse,
    TransactionFormData
} from "./types"

export const financeApi = {

    // TRANSACTIONS

    listTransactions: (ordering?: string) => {

        const query = new URLSearchParams()

        if (ordering) {
            query.append("ordering", ordering)
        }

        const url = query.toString()
            ? `core/transactions/?${query.toString()}`
            : "core/transactions/"

        return apiFetch<TransactionListResponse>(url, {
            method: "GET",
        })
    },

    createTransaction: (body: TransactionFormData) =>
        apiFetch<Transaction>("core/transactions/", {
            method: "POST",
            body: JSON.stringify(body),
        }),

    updateTransaction: (id: number, body: TransactionFormData) =>
        apiFetch<Transaction>(`core/transactions/${id}/`, {
            method: "PATCH",
            body: JSON.stringify(body),
        }),

    deleteTransaction: (id: number) =>
        apiFetch<void>(`core/transactions/${id}/`, {
            method: "DELETE",
        }),

    // CATEGORIES

    listCategories: () =>
        apiFetch<TransactionCategoryListResponse>(
            "core/transaction-categories/",
            { method: "GET" }
        ),

    createCategory: (body: TransactionCategoryPayload) =>
        apiFetch<TransactionCategory>(
            "core/transaction-categories/",
            {
                method: "POST",
                body: JSON.stringify(body),
            }
        ),

    updateCategory: (slug: string, body: Partial<TransactionCategoryPayload>) =>
        apiFetch<TransactionCategory>(
            `core/transaction-categories/${slug}/`,
            {
                method: "PATCH",
                body: JSON.stringify(body),
            }
        ),

    deleteCategory: (slug: string) =>
        apiFetch<void>(
            `core/transaction-categories/${slug}/`,
            { method: "DELETE" }
        ),

    getPnL: (start_date: string, end_date: string, group_by?: string) => {
        const params = new URLSearchParams({
            start_date,
            end_date,
            ...(group_by ? { group_by } : {}),
        })

        return apiFetch(`stats/pnl/?${params.toString()}`, {
            method: "GET",
        })
    },
}