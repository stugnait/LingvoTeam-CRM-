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
    avatar?: string | null // 👈 URL картинки з бекенду (або null, якщо її немає)
}

export interface UsersFilters {
    search: string
    role: RoleFilter
    status: boolean | null
}

export interface UsersListResponse {
    results: User[]
    total: number
    count: number
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
    avatar?: File | null | string // 👈 File при завантаженні нового, string якщо беремо існуючий, null якщо видаляємо/порожньо
}

export interface Permission {
    id: number
    name: string
    slug: string
}

export interface Role {
    id: number
    name: string
    slug: string
    permissions: Permission[]
}

export interface RoleFormData {
    name: string
    slug: string
    permission_ids: number[]
}