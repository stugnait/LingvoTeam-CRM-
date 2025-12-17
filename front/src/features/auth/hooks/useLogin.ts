"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/src/hooks/use-toast"

export function useLogin() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const { toast } = useToast()

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Check localStorage for registered users
            const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
            const user = registeredUsers.find((u: any) => u.email === email && u.password === password)

            if (user) {
                localStorage.setItem("currentUser", JSON.stringify(user))
                toast({
                    title: "Welcome back!",
                    description: "You have successfully signed in.",
                })
                router.push("/dashboard")
            } else {
                toast({
                    title: "Invalid credentials",
                    description: "Please check your email and password.",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Something went wrong. Please try again.",
                variant: "destructive",
            })
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
