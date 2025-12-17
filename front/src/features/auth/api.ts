import { apiFetch } from "@/src/shared/api/client";
import type {
    LoginPayload,
    LoginResponse,
    RegisterPayload,
    RegisterResponse,
    AuthUser,
} from "./types";

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
        apiFetch<AuthUser>("/auth/me/"),
};
