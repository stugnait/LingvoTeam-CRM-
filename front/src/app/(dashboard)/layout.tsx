"use client"

import { useState, Suspense } from "react"
import { CrmSidebar } from "@/src/components/dashboard/crm-sidebar"
import { CrmHeader } from "@/src/components/dashboard/crm-header" // Імпортуємо хедер сюди
import { cn } from "@/src/lib/utils"

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode
}) {
    const [collapsed, setCollapsed] = useState(false)

    return (
        <div className="flex min-h-screen bg-background">
            {/* САЙДБАР */}
            <Suspense fallback={<div className={collapsed ? "w-20" : "w-64"} />}>
                <CrmSidebar
                    collapsed={collapsed}
                    toggle={() => setCollapsed(prev => !prev)}
                />
            </Suspense>

            {/* КОНТЕНТНА ОБЛАСТЬ */}
            <div
                className={cn(
                    "flex flex-col flex-1 min-w-0 transition-all duration-300 ease-in-out",
                    collapsed ? "lg:ml-20" : "lg:ml-64", // Жорсткий відступ для всього блоку
                    "ml-0" // На мобілці відступу немає
                )}
            >
                {/* ХЕДЕР ТЕПЕР ТУТ (передаємо стан) */}
                <CrmHeader title="" collapsed={collapsed} />

                {/* ВМІСТ СТОРІНКИ */}
                <main className="p-6 pt-20">
                    {/* pt-20 резервує місце під фіксованим хедером, щоб нічого не залазило */}
                    {children}
                </main>
            </div>
        </div>
    )
}