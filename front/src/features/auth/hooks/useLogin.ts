"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/src/hooks/use-toast"
import { authApi } from "../api"
import type { LoginPayload, ValidationErrorResponse } from "../types"


const ROLE_REDIRECT_MAP: Record<string, string> = {
    admin: "/dashboard",
    manager: "/manager",
    driver: "/driver",
}

export function useLogin() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const { toast } = useToast()

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        const payload: LoginPayload = { email, password }

        try {
            const response = await authApi.login(payload)
            const roleSlug = response?.user?.role?.slug

            toast({
                title: "Successfully entered",
                description: "Now you can use the product",
            })

            if (!roleSlug) {
                router.replace("/no-role")
                return
            }

            const redirectPath =
                ROLE_REDIRECT_MAP[roleSlug] ?? "/dashboard"

            router.replace(redirectPath)

        } catch (err) {
            const errors = err as ValidationErrorResponse

            if (errors?.email) {
                toast({
                    title: "Login failed",
                    description: errors.email[0],
                    variant: "error",
                })
            } else {
                toast({
                    title: "Error",
                    description: "Invalid credentials or server error",
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
