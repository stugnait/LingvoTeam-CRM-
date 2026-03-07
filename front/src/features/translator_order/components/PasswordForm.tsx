"use client"

import { useState } from "react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Lock, Eye, EyeOff, KeyRound } from "lucide-react"

interface Props {
    onSubmit: (password: string) => void
    error?: string | null
    attempts: number | null
}

export function PasswordForm({ onSubmit, error, attempts }: Props) {
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!password.trim()) {return}

        setLoading(true)
        try {
            onSubmit(password)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto mt-24 p-8 rounded-xl border bg-card shadow-lg animate-slide-up">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <KeyRound className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                    Доступ до замовлення
                </h1>
                <p className="text-muted-foreground mt-2">
                    Введіть пароль для перегляду деталей замовлення
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                    <Label htmlFor="password" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Пароль
                    </Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            className="pl-10 pr-10 h-11"
                            autoComplete="current-password"
                        />
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-sm text-destructive flex items-center gap-2">
                            {error}
                            {attempts && (
                                <span className="ml-1">
                    Залишилось спроб: {attempts}
                </span>
                            )}
                        </p>
                    </div>
                )}

                <Button
                    type="submit"
                    className="w-full h-11 text-base"
                    disabled={loading || !password.trim()}
                    size="lg"
                >
                    {loading ? (
                        <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                            Перевірка...
                        </>
                    ) : (
                        "Отримати доступ"
                    )}
                </Button>

                <div className="text-center text-xs text-muted-foreground pt-4 border-t">
                    Пароль було надано разом із посиланням на замовлення
                </div>
            </form>
        </div>
    )
}