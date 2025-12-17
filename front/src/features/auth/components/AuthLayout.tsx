import Link from "next/link"
import type { ReactNode } from "react"

interface AuthLayoutProps {
    children: ReactNode
    title: string
    description: string
    footerText: string
    footerLinkText: string
    footerLinkHref: string
}

export function AuthLayout({
                               children,
                               title,
                               description,
                               footerText,
                               footerLinkText,
                               footerLinkHref,
                           }: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                            />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                    <p className="text-sm text-muted-foreground mt-2">{description}</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-8 shadow-sm">{children}</div>

                <p className="text-center text-sm text-muted-foreground mt-6">
                    {footerText}{" "}
                    <Link href={footerLinkHref} className="text-primary hover:underline font-medium">
                        {footerLinkText}
                    </Link>
                </p>
            </div>
        </div>
    )
}
