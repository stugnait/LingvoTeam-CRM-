"use client"

import { useEffect, useState } from "react"
import { Button } from "@/src/components/ui/button"
import {
    X,
    FileText,
    CheckCircle
} from "lucide-react"
import { cn } from "@/src/lib/utils"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

interface SideModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    submitLabel?: string
    cancelLabel?: string
    isLoading?: boolean
    onSubmit: () => void
    children: React.ReactNode
}

export function SideModal({
                              open,
                              onOpenChange,
                              title,
                              submitLabel,
                              cancelLabel,
                              isLoading,
                              onSubmit,
                              children,
                          }: SideModalProps) {
    const { t } = useI18n()
    const [shouldRender, setShouldRender] = useState(false)
    const [animationState, setAnimationState] = useState<'enter' | 'exit' | null>(null)
    const resolvedSubmitLabel = submitLabel ?? t("common.save")
    const resolvedCancelLabel = cancelLabel ?? t("common.cancel")

    useEffect(() => {
        const timers: ReturnType<typeof setTimeout>[] = []

        if (open) {
            timers.push(setTimeout(() => {
                setShouldRender(true)
            }, 0))
            timers.push(setTimeout(() => {
                setAnimationState('enter')
            }, 10))
        } else {
            timers.push(setTimeout(() => {
                setAnimationState('exit')
            }, 0))
            timers.push(setTimeout(() => {
                setShouldRender(false)
                setAnimationState(null)
            }, 300))
        }

        return () => {
            timers.forEach(clearTimeout)
        }
    }, [open])

    if (!shouldRender) {
        return null
    }

    const isOpen = animationState === 'enter'

    return (
        <>
            {/* Backdrop with blur */}
            <div
                className={cn(
                    "fixed inset-0 z-[200] transition-all duration-300",
                    isOpen
                        ? "opacity-100 backdrop-blur-sm bg-black/30"
                        : "opacity-0 backdrop-blur-0 bg-black/0"
                )}
                onClick={() => onOpenChange(false)}
            />

            {/* Modal side panel with blue gradient */}
            <div className={cn(
                "fixed right-0 top-0 bottom-0 z-[210] w-full sm:max-w-2xl",
                "transition-transform duration-300 ease-out",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="h-full bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col relative overflow-hidden">

                    {/* Blue gradient background effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-50/30 to-transparent dark:from-blue-950/20 dark:to-transparent pointer-events-none" />

                    {/* Top blue gradient line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600" />

                    {/* Header */}
                    <div className="relative flex items-center justify-between px-4 sm:px-6 py-3 sm:py-5 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
                                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-base sm:text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent truncate">
                                    {title}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                                    {t("common.fillOrderDetails")}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="rounded-lg w-9 h-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
                        >
                            <X className="h-4 w-4 text-gray-500" />
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 relative">
                        <div className="space-y-4 sm:space-y-6">
                            {children}
                        </div>
                    </div>

                    {/* Footer with blue gradient button */}
                    <div className="relative px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-800 bg-gradient-to-t from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                                className="w-full sm:w-auto px-4 py-2 h-9 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-lg text-sm"
                            >
                                {resolvedCancelLabel}
                            </Button>
                            <Button
                                onClick={onSubmit}
                                disabled={isLoading}
                                className="w-full sm:w-auto px-4 py-2 h-9 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 transition-all rounded-lg text-sm font-medium"
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                        <span>{resolvedSubmitLabel}...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4" />
                                        <span>{resolvedSubmitLabel}</span>
                                    </div>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
