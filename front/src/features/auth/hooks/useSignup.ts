"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/src/hooks/use-toast"

export function useSignup() {
    const [name, setName] = useState("")
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

            // Get existing users or initialize empty array
            const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]")

            // Check if user already exists
            const userExists = registeredUsers.some((u: any) => u.email === email)

            if (userExists) {
                toast({
                    title: "Email already registered",
                    description: "Please use a different email or sign in.",
                    variant: "destructive",
                })
                setIsLoading(false)
                return
            }

            // Create new user
            const newUser = {
                id: Date.now().toString(),
                name,
                email,
                password,
                role: "Editor",
                status: "Active",
                joinDate: new Date().toISOString(),
            }

            // Save to localStorage
            registeredUsers.push(newUser)
            localStorage.setItem("registeredUsers", JSON.stringify(registeredUsers))
            localStorage.setItem("currentUser", JSON.stringify(newUser))

            toast({
                title: "Account created!",
                description: "Welcome to Translation CRM.",
            })

            router.push("/dashboard")
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
        name,
        email,
        password,
        setName,
        setEmail,
        setPassword,
        handleSubmit,
        isLoading,
    }
}
