"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Lock, Home, ArrowLeft, Globe } from "lucide-react"

export default function Error403Page() {
    const router = useRouter()
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
                    <Lock className="w-10 h-10 text-primary" />
                </div>

                <h1 className="text-7xl font-bold text-primary mb-4">403</h1>

                <h2 className="text-2xl font-semibold text-foreground mb-3">
                    Доступ заборонено
                </h2>

                <p className="text-muted-foreground mb-8">
                    У вас немає прав для перегляду цієї сторінки. Зверніться до адміністратора, якщо вважаєте, що це помилка.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-lg text-foreground hover:bg-accent transition-colors cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Назад
                    </button>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        На головну
                    </Link>
                </div>
            </div>

            <p className="mt-16 text-sm text-muted-foreground">
                Translation CRM &copy; {new Date().getFullYear()}
            </p>
        </div>
    )
}
