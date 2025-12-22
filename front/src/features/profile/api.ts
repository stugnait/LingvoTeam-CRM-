import { apiFetch } from "@/src/shared/api/client"
import type { ProfileUser, ChangePasswordPayload } from "./types"

export const profileApi = {
    me: () =>
        apiFetch<ProfileUser>("users/me/", {
            method: "GET",
        }),

    updateProfile: (data: Partial<ProfileUser>) =>
        apiFetch<ProfileUser>("users/user/update/", {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    changePassword: (data: ChangePasswordPayload) =>
        apiFetch<{ message: string; logout?: boolean }>(
            "users/user/change-password/",
            {
                method: "POST",
                body: JSON.stringify(data),
            }
        ),
}
