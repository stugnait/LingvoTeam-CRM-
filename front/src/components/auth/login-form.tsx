"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function LoginForm() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        // Simulate authentication with users from localStorage
        setTimeout(() => {
            if (!email || !password) {
                setError("Please enter both email and password")
                setIsLoading(false)
                return
            }

            // Check against registered users
            const users = JSON.parse(localStorage.getItem("users") || "[]")
            const user = users.find((u: any) => u.email === email && u.password === password)

            if (user) {
                // Store current user session
                localStorage.setItem("currentUser", JSON.stringify(user))
                router.push("/dashboard")
            } else {
                setError("Invalid email or password")
                setIsLoading(false)
            }
        }, 1000)
    }

    return (
        <Card className="border-border">
            <CardHeader>
                <CardTitle className="text-xl">Sign In</CardTitle>
                <CardDescription>Enter your credentials to access the CRM</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="admin@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                    <button type="button" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        Forgot password?
                    </button>
                    <p className="text-sm text-center text-muted-foreground">
                        Don't have an account?{" "}
                        <Link href="/signup" className="text-primary hover:underline font-medium">
                            Create account
                        </Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    )
}
