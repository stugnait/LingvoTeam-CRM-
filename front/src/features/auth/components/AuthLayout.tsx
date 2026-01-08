// src/features/auth/components/AuthLayout.tsx
import Link from "next/link"
import type { ReactNode } from "react"
import { Languages } from "lucide-react"
import { cn } from "@/src/lib/utils"

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
                               footerText,
                               footerLinkText,
                               footerLinkHref,
                               backgroundImage = true,
                           }: AuthLayoutProps) {
    return (
        <div className="auth-container min-h-screen flex items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-lg">
                {/* Logo & Header */}
                <div className="mb-10 text-center">
                    <div className="inline-flex items-center justify-center mb-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-lg">
                                <Languages className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <div className="ml-4 text-left">
                            <div className="text-2xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                  LingvoTeam
                </span>
                            </div>
                            <div className="text-xs text-muted-foreground font-medium">Translation Management</div>
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-foreground mb-3">{title}</h1>
                    <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">{description}</p>
                </div>

                {/* Auth Card */}
                <div className="auth-card">
                    <div className="relative">
                        {/* Decorative elements */}
                        <div className="absolute -top-4 -right-4 h-24 w-24 bg-primary/5 rounded-full blur-2xl" />
                        <div className="absolute -bottom-4 -left-4 h-20 w-20 bg-primary/5 rounded-full blur-2xl" />

                        {children}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        {footerText}{" "}
                        <Link
                            href={footerLinkHref}
                            className="auth-link font-semibold inline-flex items-center gap-1.5 group"
                        >
                            {footerLinkText}
                            <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                        </Link>
                    </p>

                    {/* Additional links */}
                    <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-border/50">
                        <Link
                            href="/terms"
                            className="text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                            Terms of Service
                        </Link>
                        <Link
                            href="/privacy"
                            className="text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                            Privacy Policy
                        </Link>
                        <Link
                            href="/support"
                            className="text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                            Support
                        </Link>
                    </div>
                </div>
            </div>

            {/* Background decoration */}
            {backgroundImage && (
                <>
                    <div className="fixed inset-0 -z-10 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 dark:from-gray-950 dark:via-blue-950/10 dark:to-indigo-950/5" />
                    <div className="fixed inset-0 -z-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/10 via-transparent to-transparent dark:from-blue-900/5" />

                    {/* Floating elements */}
                    <div className="fixed top-1/4 left-10 -z-10 h-64 w-64 rounded-full bg-gradient-to-r from-primary/5 to-primary/10 blur-3xl" />
                    <div className="fixed bottom-1/4 right-10 -z-10 h-96 w-96 rounded-full bg-gradient-to-r from-primary/5 to-primary/10 blur-3xl" />
                </>
            )}
        </div>
    )
}