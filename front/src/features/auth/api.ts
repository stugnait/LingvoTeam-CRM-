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
        apiFetch<LoginResponse>("auth/login/", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    register: (data: RegisterPayload) =>
        apiFetch<RegisterResponse>("auth/register/", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    me: () =>
        apiFetch<AuthUser>("auth/me/"),

    forgotPassword: (payload: ForgotPasswordPayload) =>
        apiFetch<ForgotPasswordResponse>("auth/forgot-password/", {
            method: "POST",
            body: JSON.stringify(payload),
        }),

    resetPassword: (payload: ResetPasswordPayload) =>
        apiFetch<ResetPasswordResponse>("auth/reset-password/", {
            method: "POST",
            body: JSON.stringify(payload),
        }),
}
