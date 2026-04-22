// types.ts

export interface User {
    id: number;
    email: string;
    full_name: string;
    phone: string;
    role: {
        id: number;
        name: string;
        slug: string;
    };
    is_active: boolean;
}

export interface Salary {
    id: number;
    user: number;
    full_name: string;
    role: number;
    start_date: string;
    end_date: string;
    revenue: string | number; // Django Decimal приходить як string
    orders_count: number;
    overdue_orders_count: number;
    margin: string | number;
    base_salary: string | number;
    bonus: string | number;
    premium: string | number;
    total: string | number;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface SalaryPreview {
    user: number;
    full_name: string;
    base_salary: string | number;
    bonus: string | number;
    premium: string | number;
    revenue: string | number;
    orders_count: number;
    overdue_orders_count: number;
    margin: string | number;
}

export interface SalaryCreatePayload {
    user: number;
    start_date: string;
    end_date: string;
    base_salary?: number | string;
    bonus?: number | string;
    premium?: number | string;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}