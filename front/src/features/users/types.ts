export type RoleFilter =
    | "all"
    | "admin"
    | "manager"
    | "editor"
    | "finance"

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
    role: UserRole
    is_active: boolean
    date_joined: string
}

export interface UsersFilters {
    search: string
    role: RoleFilter
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

export interface UserFormData {
    full_name: string
    email: string
    phone: string
    role: number
    is_active: boolean
}