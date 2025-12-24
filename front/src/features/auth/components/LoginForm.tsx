// src/features/auth/components/LoginForm.tsx
"use client"

import { useState } from "react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { useLogin } from "../hooks/useLogin"
import { ForgotPasswordModal } from "./ForgotPasswordModal"

export function LoginForm() {
    const { email, password, setEmail, setPassword, handleSubmit, isLoading } = useLogin()
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        autoComplete="email"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <button
                            type="button"
                            onClick={() => setIsForgotPasswordOpen(true)}
                            className="text-xs text-primary hover:underline"
                        >
                            Forgot password?
                        </button>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        autoComplete="current-password"
                    />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign in"}
                </Button>
            </form>

            <ForgotPasswordModal
                open={isForgotPasswordOpen}
                onOpenChange={setIsForgotPasswordOpen}
            />
        </>
    )
}