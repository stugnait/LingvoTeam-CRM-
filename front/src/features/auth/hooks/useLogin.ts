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

        const payload: LoginPayload = {
            email,
            password
        }

        try {
            // Simulate API call
            await authApi.login(payload)

            toast({
                title: "Successfully entered",
                description: "Now you can use the product"
            })
            router.push("/dashboard")
        } catch (err) {
            const errors = err as ValidationErrorResponse

            if (errors?.email) {
                toast({
                    title: "Registration failed",
                    description: errors.email[0],
                    variant: "error",
                })
            } else if (errors?.password_confirm) {
                toast({
                    title: "Password mismatch",
                    description: errors.password_confirm[0],
                    variant: "error",
                })
            } else {
                toast({
                    title: "Error",
                    description: "Something went wrong. Please try again.",
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
