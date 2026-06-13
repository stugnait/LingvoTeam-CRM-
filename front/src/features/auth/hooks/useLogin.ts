"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/src/hooks/use-toast"
import { authApi } from "../api"
import type { LoginPayload, ValidationErrorResponse } from "../types"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

type LoginErrorResponse = ValidationErrorResponse & {
    status?: number
}

export function useLogin() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const router = useRouter()
    const { toast } = useToast()
    const { t } = useI18n()

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        const payload: LoginPayload = { email, password }

        try {
            await authApi.login(payload)

            toast({
                title: t("auth.loginSuccessTitle"),
                description: t("auth.loginSuccessDescription"),
            })

            // Єдиний редірект
            router.replace("/dashboard/")

        } catch (err) {
            const errors = err as LoginErrorResponse

            if (errors?.status === 401) {
                toast({
                    title: t("auth.loginFailed"),
                    description: t("auth.incorrectCredentials"),
                    variant: "error",
                })
            } else if (errors?.email) {
                toast({
                    title: t("auth.loginFailed"),
                    description: errors.email[0],
                    variant: "error",
                })
            } else {
                toast({
                    title: t("auth.error"),
                    description: t("auth.invalidCredentials"),
                    variant: "error",
                })
            }
        } finally {
            setIsLoading(false)
        }
    }

    return {
        email,
        password,
        setEmail,
        setPassword,
        handleSubmit,
        isLoading,
    }
}
