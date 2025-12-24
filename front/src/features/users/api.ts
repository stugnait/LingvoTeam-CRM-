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
        apiFetch<UsersListResponse>("users/", {
            method: "GET",
        }),

    // GET /users/:id/
    getById: (id: string) =>
        apiFetch<User>(`users/${id}/`, {
            method: "GET",
        }),

    // POST /users/
    create: (data: UserFormData) =>
        apiFetch<User>("users/", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    register: (data: UserFormData) =>
        apiFetch<RegisterResponse>("auth/register/", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    // PATCH /users/:id/
    update: (id: string, data: UserFormData) =>
        apiFetch<User>(`users/${id}/`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    // DELETE /users/:id/
    remove: (id: string) =>
        apiFetch<void>(`users/${id}/`, {
            method: "DELETE",
        }),

    deactivate: (id: string) =>
        apiFetch<void>(`admin/blackout/${id}/`, {
            method: "POST"
        }),
}
