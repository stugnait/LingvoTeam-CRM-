export interface UserRole {
    id: number
    name: string
    slug: string
}

export interface ProfileUser {
    id: string
    full_name: string
    email: string
    role: UserRole
    is_active: boolean
}

export interface ChangePasswordPayload {
    current_password: string
    new_password: string
}
