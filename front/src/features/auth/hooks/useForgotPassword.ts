// src/features/auth/hooks/useForgotPassword.ts
"use client"

import { useState } from "react"
import { useToast } from "@/src/hooks/use-toast"
import { authApi } from "../api"
import type { ForgotPasswordPayload, ValidationErrorResponse } from "../types"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

export function useForgotPassword() {
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const { toast } = useToast()
    const { t } = useI18n()

    const submit = async () => {
        if (!email) {
            toast({
                title: t("auth.emailRequired"),
                description: t("auth.emailRequiredDescription"),
                variant: "error",
            })
            return
        }

        setIsLoading(true)
        setIsSuccess(false)

        const payload: ForgotPasswordPayload = { email }

        try {
            const response = await authApi.forgotPassword(payload)

            setIsSuccess(true)
            toast({
                title: t("auth.emailSent"),
                description:
                    response?.detail ??
                    t("auth.emailSentDescription"),
            })
        } catch (err) {
            const errors = err as ValidationErrorResponse

            if (errors?.email?.length) {
                toast({
                    title: t("auth.invalidEmail"),
                    description: errors.email[0],
                    variant: "error",
                })
            } else if (typeof errors?.detail === "string") {
                toast({
                    title: t("auth.error"),
                    description: errors.detail,
                    variant: "error",
                })
            } else {
                toast({
                    title: t("auth.error"),
                    description: t("auth.resetEmailFailed"),
                    variant: "error",
                })
            }
        } finally {
            setIsLoading(false)
        }
    }

    const resetForm = () => {
        setEmail("")
        setIsSuccess(false)
    }

    return {
        email,
        setEmail,
        submit,
        isLoading,
        isSuccess,
        resetForm,
    }
}
