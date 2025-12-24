// src/features/auth/hooks/useForgotPassword.ts
"use client"

import { useState } from "react"
import { useToast } from "@/src/hooks/use-toast"
import { authApi } from "../api"
import type { ForgotPasswordPayload, ValidationErrorResponse } from "../types"

export function useForgotPassword() {
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const { toast } = useToast()

    const submit = async () => {
        if (!email) {
            toast({
                title: "Email required",
                description: "Please enter your email address",
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
                title: "Email sent",
                description:
                    response?.detail ??
                    "Check your email for password reset instructions",
            })
        } catch (err) {
            const errors = err as ValidationErrorResponse

            if (errors?.email?.length) {
                toast({
                    title: "Invalid email",
                    description: errors.email[0],
                    variant: "error",
                })
            } else if (typeof errors?.detail === "string") {
                toast({
                    title: "Error",
                    description: errors.detail,
                    variant: "error",
                })
            } else {
                toast({
                    title: "Error",
                    description: "Failed to send reset email. Please try again.",
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
