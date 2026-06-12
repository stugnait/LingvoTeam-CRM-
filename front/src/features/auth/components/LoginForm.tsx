// src/features/auth/components/LoginForm.tsx
"use client"

import { useState } from "react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { useLogin } from "../hooks/useLogin"
import { ForgotPasswordModal } from "./ForgotPasswordModal"
import { Lock, Mail, Eye, EyeOff } from "lucide-react"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

export function LoginForm() {
    const { email, password, setEmail, setPassword, handleSubmit, isLoading } = useLogin()
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const { t } = useI18n()

    return (
        <>
            <form onSubmit={handleSubmit} className="auth-form animate-slide-up">
                {/* Email */}
                <div className="space-y-2.5">
                    <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {t("auth.email")}
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
                            // h-11 + text-base: запобігає авто-зуму на iOS (font-size < 16px)
                            className="pl-10 h-11 text-base sm:text-sm"
                        />
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                </div>

                {/* Password */}
                <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            {t("auth.password")}
                        </Label>
                        <button
                            type="button"
                            onClick={() => setIsForgotPasswordOpen(true)}
                            // py-1 px-1 — більша зона кліку на мобільному
                            className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200 py-1 px-1 -mr-1"
                        >
                            {t("auth.forgotPassword")}
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
                            className="pl-10 pr-11 h-11 text-base sm:text-sm"
                        />
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        {/* Розширена зона кліку для eye-toggle */}
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-0 top-0 h-full px-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                {/* Submit — h-12 на мобільному для зручного дотику */}
                <Button
                    type="submit"
                    className="w-full mt-6 h-12 sm:h-10 text-base sm:text-sm"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                            {t("auth.signingIn")}
                        </>
                    ) : (
                        t("auth.signIn")
                    )}
                </Button>

                <div className="text-center text-xs text-muted-foreground mt-4">
                    {t("auth.termsNotice")}
                </div>
            </form>

            <ForgotPasswordModal
                open={isForgotPasswordOpen}
                onOpenChange={setIsForgotPasswordOpen}
            />
        </>
    )
}
