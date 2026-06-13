"use client"

import { useState } from "react"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Button } from "@/src/components/ui/button"
import { CheckCircle2, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react"
import { useResetPassword } from "../hooks/useResetPassword"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

interface ResetPasswordFormProps {
    uid: string
    token: string
}

export function ResetPasswordForm({ uid, token }: ResetPasswordFormProps) {
    const { t } = useI18n()

    const [password, setPassword] = useState("")
    const [confirm, setConfirm] = useState("")
    const [isSuccess, setIsSuccess] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const { submit, isLoading } = useResetPassword({ uid, token })

    const onSubmit = async () => {
        if (password !== confirm || !password.trim()) {
            return
        }
        try {
            await submit(password, confirm)
            setIsSuccess(true)
        } catch (error: unknown) {
            console.log(error instanceof Error ? error.message : "Something went wrong")
        }
    }

    if (isSuccess) {
        return (
            // mt-24 -> mt-8 на мобільному, p-8 -> p-5 на мобільному
            <div className="max-w-md mx-auto mt-8 sm:mt-16 md:mt-24 p-5 sm:p-8 rounded-xl border bg-card shadow-lg animate-slide-up text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500/10 mb-4 sm:mb-6">
                    <CheckCircle2 className="h-7 w-7 sm:h-8 sm:w-8 text-green-500" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                    {t("auth.passwordUpdated")}
                </h1>
                <div className="space-y-4 mt-4">
                    <p className="text-sm sm:text-base text-muted-foreground">
                        {t("auth.passwordUpdatedDescription")} <br />
                        <span className="font-medium text-foreground">{t("auth.closeThisPage")}</span>
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-md mx-auto mt-8 sm:mt-16 md:mt-24 p-5 sm:p-8 rounded-xl border bg-card shadow-lg animate-slide-up">
            <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 mb-3 sm:mb-4">
                    <ShieldCheck className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                    {t("auth.newPassword")}
                </h1>
                <p className="text-sm text-muted-foreground mt-2">
                    {t("auth.newPasswordDescription")}
                </p>
            </div>

            <form
                onSubmit={(e) => { e.preventDefault(); onSubmit() }}
                className="space-y-5 sm:space-y-6"
            >
                {/* New Password */}
                <div className="space-y-3">
                    <Label htmlFor="new-password" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        {t("auth.newPassword")}
                    </Label>
                    <div className="relative">
                        <Input
                            id="new-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            // h-11 + text-base — запобігає зуму на iOS
                            className="pl-10 pr-11 h-11 text-base sm:text-sm"
                        />
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
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

                {/* Confirm Password */}
                <div className="space-y-3">
                    <Label htmlFor="confirm-password" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        {t("auth.confirmPassword")}
                    </Label>
                    <div className="relative">
                        <Input
                            id="confirm-password"
                            type={showConfirm ? "text" : "password"}
                            placeholder="••••••••"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            required
                            disabled={isLoading}
                            className="pl-10 pr-11 h-11 text-base sm:text-sm"
                        />
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute right-0 top-0 h-full px-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={showConfirm ? t("auth.hidePassword") : t("auth.showPassword")}
                        >
                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full h-12 sm:h-11 text-base sm:text-sm"
                    disabled={isLoading || !password.trim() || password !== confirm}
                >
                    {isLoading ? (
                        <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                            {t("auth.updating")}
                        </>
                    ) : (
                        t("auth.saveChanges")
                    )}
                </Button>

                <div className="text-center text-xs text-muted-foreground pt-4 border-t">
                    {t("auth.passwordHint")}
                </div>
            </form>
        </div>
    )
}
