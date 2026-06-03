import { apiFetch } from "@/src/shared/api/client"
import type {
    LoginPayload,
    LoginResponse,
    RegisterPayload,
    RegisterResponse,
    AuthUser,
    ForgotPasswordResponse,
    ForgotPasswordPayload,
    ResetPasswordPayload,
    ResetPasswordResponse,
} from "./types"

export const authApi = {
    login: (data: LoginPayload) =>
        apiFetch<LoginResponse>("users/auth/login/", {
            method: "POST",
            body: JSON.stringify(data),
            skipGlobalError: true,
        }),

    register: (data: RegisterPayload) =>
        apiFetch<RegisterResponse>("users/auth/register/", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    me: () =>
        apiFetch<AuthUser>("users/users/me/", {
            method: "GET",
        }),

    forgotPassword: (payload: ForgotPasswordPayload) =>
        apiFetch<ForgotPasswordResponse>("users/auth/forgot-password/", {
            method: "POST",
            body: JSON.stringify(payload),
        }),

    resetPassword: (payload: ResetPasswordPayload) =>
        apiFetch<ResetPasswordResponse>("users/auth/reset-password/", {
            method: "POST",
            body: JSON.stringify(payload),
        }),
}
