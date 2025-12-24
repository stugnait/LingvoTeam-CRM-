export interface UserRole {
    id: number
    name: string
    slug: string
}

export interface User {
    id: string
    full_name: string
    email: string
    phone: string
    role: UserRole      // ← ОБʼЄКТ
    is_active: boolean     // ← BOOLEAN
    date_joined: string
}

export interface UsersFilters {
    search: string
    role: "all" | "admin" | "manager" | "editor" | "finance"
    status: boolean | null
}


export interface UsersListResponse {
    results: User[]
    total: number
}

export interface UsersQueryParams extends UsersFilters {
    page?: number
    page_size?: number
}

/**
 * Дані, які відправляємо у форму / API
 * (НЕ весь User)
 */
export interface UserFormData {
    full_name: string
    email: string
    phone: string
    role: number      // role.id
    is_active: boolean    // status.id
}
