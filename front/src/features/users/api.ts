import { apiFetch } from "@/src/shared/api/client"
import type {
    User,
    UserFormData,
    UsersListResponse,
    // UsersQueryParams,
} from "./types"
import type {RegisterPayload, RegisterResponse} from "@/src/features/auth/types";

export const usersApi = {
    // GET /users/?search=&role=&status=
    list: () =>
        apiFetch<UsersListResponse>("v1/users/", {
            method: "GET",
        }),

    // GET /users/:id/
    getById: (id: string) =>
        apiFetch<User>(`v1/users/${id}/`, {
            method: "GET",
        }),

    // POST /users/
    create: (data: UserFormData) =>
        apiFetch<User>("v1/users/", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    register: (data: UserFormData) =>
        apiFetch<RegisterResponse>("v1/auth/register/", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    // PATCH /users/:id/
    update: (id: string, data: UserFormData) =>
        apiFetch<User>(`v1/users/${id}/`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    // DELETE /users/:id/
    remove: (id: string) =>
        apiFetch<void>(`v1/users/${id}/`, {
            method: "DELETE",
        }),

    deactivate: (id: string) =>
        apiFetch<void>(`v1/admin/users/${id}/toggle-status/`, {
            method: "POST"
        }),
}
