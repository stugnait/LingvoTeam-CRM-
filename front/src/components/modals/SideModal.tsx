"use client"

import { useEffect, useState } from "react"
import { Button } from "@/src/components/ui/button"
import { X } from "lucide-react"

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
                              submitLabel = "Save",
                              cancelLabel = "Cancel",
                              isLoading,
                              onSubmit,
                              children,
                          }: SideModalProps) {
    const [shouldRender, setShouldRender] = useState(false)
    const [animationState, setAnimationState] = useState<'enter' | 'exit' | null>(null)

    useEffect(() => {
        if (open) {
            setShouldRender(true)
            // Невелика затримка для ініціалізації анімації
            setTimeout(() => {
                setAnimationState('enter')
            }, 10)
        } else {
            setAnimationState('exit')
            // Затримка для завершення анімації перед видаленням з DOM
            setTimeout(() => {
                setShouldRender(false)
                setAnimationState(null)
            }, 300)
        }
    }, [open])

    if (!shouldRender) {return null}

    const isOpen = animationState === 'enter'

    return (
        <>
            {/* Backdrop with blur */}
            <div
                className={`fixed inset-0 z-50 bg-black/20 backdrop-blur-sm transition-all duration-300 ease-out ${
                    isOpen ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={() => onOpenChange(false)}
            />

            {/* Modal side panel */}
            <div className={`fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg ${
                isOpen ? 'animate-slide-in-right' : 'animate-slide-out-right'
            }`}>
                <div className="h-full bg-card border-l border-border shadow-2xl flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                        <h2 className="text-xl font-semibold text-foreground">
                            {title}
                        </h2>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="rounded-full w-8 h-8 p-0 hover:bg-muted/50 transition-smooth"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-6">
                        <div className="space-y-6">
                            {children}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-border bg-muted/30">
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                                className="transition-smooth"
                            >
                                {cancelLabel}
                            </Button>
                            <Button
                                onClick={onSubmit}
                                disabled={isLoading}
                                className="transition-smooth hover-lift"
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="loading-spinner h-4 w-4" />
                                        <span>{submitLabel}...</span>
                                    </div>
                                ) : (
                                    submitLabel
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}