// salary/types.ts

export interface Salary {
    id: number
    user: number

    start_date: string
    end_date: string

    revenue: number
    orders_count: number
    overdue_orders_count: number
    margin: number

    rate: number
    bonus: number
    premium: number

    total: number

    created_at: string
}

export interface SalaryCreatePayload {
    user: number
    start_date: string
    end_date: string

    // опціонально (бек сам перерахує)
    rate?: number
    bonus?: number
    premium?: number
}

export interface SalaryListResponse {
    results: Salary[]
    count: number
}