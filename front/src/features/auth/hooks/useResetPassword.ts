"use client"

import { useState } from "react"
import { authApi } from "../api"

interface UseResetPasswordProps {
    uid: string
    token: string
}

export function useResetPassword({ uid, token }: UseResetPasswordProps) {
    const [isLoading, setIsLoading] = useState(false)

    const submit = async (new_password: string, new_password_confirm: string) => {
        setIsLoading(true)
        try {
            await authApi.resetPassword({ uid, token, new_password, new_password_confirm })
        } catch (err: any) {
            // Бекенд поверне щось типу { detail: "Invalid token" }
            const message = err?.detail || err?.token?.[0] || "Invalid or expired reset link"
            throw new Error(message)
        } finally {
            setIsLoading(false)
        }
    }

    return { submit, isLoading }
}
