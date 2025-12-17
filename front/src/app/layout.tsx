import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "@/src/styles/global.css"
import { Toaster } from "@/src/components/ui/toaster"

const geistSans = Geist({
    subsets: ["latin"],
    variable: "--font-geist-sans",
    display: "swap",
})

const geistMono = Geist_Mono({
    subsets: ["latin"],
    variable: "--font-geist-mono",
    display: "swap",
})

export const metadata: Metadata = {
    title: "Translation CRM - Admin Panel",
    description: "Enterprise translation management system",
    icons: {
        icon: [
            {
                url: "/icon-light-32x32.png",
                media: "(prefers-color-scheme: light)",
            },
            {
                url: "/icon-dark-32x32.png",
                media: "(prefers-color-scheme: dark)",
            },
            {
                url: "/icon.svg",
                type: "image/svg+xml",
            },
        ],
        apple: "/apple-icon.png",
    },
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html
            lang="en"
            className={`${geistSans.variable} ${geistMono.variable}`}
            suppressHydrationWarning
        >
        <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        {children}
        <Toaster />
        </body>
        </html>
    )
}
