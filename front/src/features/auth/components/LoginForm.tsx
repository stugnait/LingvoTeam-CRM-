// src/features/auth/components/LoginForm.tsx
"use client"

import { useState } from "react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { useLogin } from "../hooks/useLogin"
import { ForgotPasswordModal } from "./ForgotPasswordModal"
import { Lock, Mail, Eye, EyeOff } from "lucide-react"

export function LoginForm() {
    const { email, password, setEmail, setPassword, handleSubmit, isLoading } = useLogin()
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    return (
        <>
            <form onSubmit={handleSubmit} className="auth-form animate-slide-up">
                {/* Email */}
                <div className="space-y-2.5">
                    <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                    </Label>
                    <div className="relative">
                        <Input
                            id="email"
                            type="email"
                            placeholder="some@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                            autoComplete="email"
                            className="pl-10"
                        />
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                </div>

                {/* Password */}
                <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            Password
                        </Label>
                        <button
                            type="button"
                            onClick={() => setIsForgotPasswordOpen(true)}
                            className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200"
                        >
                            Forgot password?
                        </button>
                    </div>

                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            autoComplete="current-password"
                            className="pl-10 pr-10"
                        />
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Submit */}
                <Button
                    type="submit"
                    className="w-full mt-6"
                    disabled={isLoading}
                    size="lg"
                >
                    {isLoading ? (
                        <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                            Signing in...
                        </>
                    ) : (
                        "Sign in"
                    )}
                </Button>

                <div className="text-center text-xs text-muted-foreground mt-4">
                    By continuing, you agree to our Terms and Privacy Policy
                </div>
            </form>

            <ForgotPasswordModal
                open={isForgotPasswordOpen}
                onOpenChange={setIsForgotPasswordOpen}
            />
        </>
    )
}