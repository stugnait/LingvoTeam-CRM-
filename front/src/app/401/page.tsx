"use client"

import Link from "next/link"
import { Globe, LogIn } from "lucide-react"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

export default function Error401Page() {
    const { t } = useI18n()

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="flex items-center gap-2 mb-12">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                    <Globe className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-semibold text-foreground">Translation CRM</span>
            </div>

            <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <LogIn className="w-10 h-10 text-primary" />
                </div>

                <h1 className="text-7xl font-bold text-primary mb-4">401</h1>

                <h2 className="text-2xl font-semibold text-foreground mb-3">
                    {t("error.sessionEndedTitle")}
                </h2>

                <p className="text-muted-foreground mb-8">
                    {t("error.sessionEndedDescription")}
                </p>

                <div className="flex justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors w-full sm:w-auto"
                    >
                        <LogIn className="w-4 h-4" />
                        {t("error.goToLogin")}
                    </Link>
                </div>
            </div>

            <p className="mt-16 text-sm text-muted-foreground">
                Translation CRM &copy; {new Date().getFullYear()}
            </p>
        </div>
    )
}
