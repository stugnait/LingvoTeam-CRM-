// src/features/auth/components/AuthLayout.tsx
"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { Languages } from "lucide-react"
import { LanguageSwitcher } from "@/src/shared/i18n/LanguageSwitcher"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

interface AuthLayoutProps {
    children: ReactNode
    title: string
    description: string
    footerText: string
    footerLinkText: string
    footerLinkHref: string
    backgroundImage?: boolean
}

export function AuthLayout({
                               children,
                               title,
                               description,
                               backgroundImage = true,
                           }: AuthLayoutProps) {
    const { t } = useI18n()

    return (
        <div className="auth-container min-h-screen flex items-center justify-center">
            <div className="fixed right-4 top-4 z-10">
                <LanguageSwitcher />
            </div>
            <div className="w-full max-w-lg">

                {/* Logo & Header */}
                <div className="mb-6 sm:mb-10 text-center">
                    <div className="inline-flex items-center justify-center mb-4 sm:mb-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                            <div className="relative flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-lg">
                                <Languages className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                            </div>
                        </div>
                        <div className="ml-3 sm:ml-4 text-left">
                            <div className="text-xl sm:text-2xl font-bold tracking-tight">
                                <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                                    LingvoTeam
                                </span>
                            </div>
                            <div className="text-xs text-muted-foreground font-medium">{t("auth.translationManagement")}</div>
                        </div>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 sm:mb-3">{title}</h1>
                    <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">{description}</p>
                </div>

                {/* Auth Card */}
                <div className="auth-card">
                    <div className="relative">
                        {/* Decorative elements — тільки на sm+ */}
                        <div className="hidden sm:block absolute -top-4 -right-4 h-24 w-24 bg-primary/5 rounded-full blur-2xl" />
                        <div className="hidden sm:block absolute -bottom-4 -left-4 h-20 w-20 bg-primary/5 rounded-full blur-2xl" />
                        {children}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 sm:mt-8 text-center">
                    <div className="flex items-center justify-center flex-wrap gap-4 sm:gap-6 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border/50">
                        <Link href="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                            {t("auth.terms")}
                        </Link>
                        <Link href="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                            {t("auth.privacy")}
                        </Link>
                        <Link href="/support" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                            {t("auth.support")}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Background decoration */}
            {backgroundImage && (
                <>
                    <div className="fixed inset-0 -z-10 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 dark:from-gray-950 dark:via-blue-950/10 dark:to-indigo-950/5" />
                    <div className="fixed inset-0 -z-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/10 via-transparent to-transparent dark:from-blue-900/5" />
                    {/* Floating elements — тільки на md+ */}
                    <div className="hidden md:block fixed top-1/4 left-10 -z-10 h-64 w-64 rounded-full bg-gradient-to-r from-primary/5 to-primary/10 blur-3xl" />
                    <div className="hidden md:block fixed bottom-1/4 right-10 -z-10 h-96 w-96 rounded-full bg-gradient-to-r from-primary/5 to-primary/10 blur-3xl" />
                </>
            )}
        </div>
    )
}
