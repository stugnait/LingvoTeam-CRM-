"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/src/hooks/use-toast"
import { authApi } from "../api"
import type { RegisterPayload, ValidationErrorResponse } from "../types"

export function useSignup() {
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [role, setRole] = useState<number | null>(null)
    const [password, setPassword] = useState("")
    const [passwordConfirm, setPasswordConfirm] = useState("")
    const [phoneCountryCode, setPhoneCountryCode] = useState("+380")
    const [phoneNationalNumber, setPhoneNationalNumber] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const router = useRouter()
    const { toast } = useToast()

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()

        if (role === null) {
            toast({
                title: "Role is required",
                variant: "error",
            })
            return
        }

        setIsLoading(true)

        const payload: RegisterPayload = {
            full_name: fullName,
            email,
            role,
            password,
            password_confirm: passwordConfirm,
            phone_country_code: phoneCountryCode,
            phone_national_number: phoneNationalNumber,
        }

        try {
            await authApi.register(payload)

            toast({
                title: "Account created",
                description: "You can now sign in.",
            })

            router.push("/login")
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
        fullName,
        email,
        role,
        password,
        passwordConfirm,
        phoneCountryCode,
        phoneNationalNumber,

        setFullName,
        setEmail,
        setRole,
        setPassword,
        setPasswordConfirm,
        setPhoneCountryCode,
        setPhoneNationalNumber,

        handleSubmit,
        isLoading,
    }
}
