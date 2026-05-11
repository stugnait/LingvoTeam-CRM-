"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/src/hooks/use-toast"
import { authApi } from "../api"
import type { LoginPayload, ValidationErrorResponse } from "../types"

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
            await authApi.login(payload)

            toast({
                title: "Successfully entered",
                description: "Now you can use the product",
            })

            // Єдиний редірект
            router.replace("/dashboard/")

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