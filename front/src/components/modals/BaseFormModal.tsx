"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../ui/dialog"
import { Button } from "../ui/button"
import { cn } from "@/src/lib/utils"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

interface BaseFormModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description?: string
    icon?: React.ReactNode
    submitLabel?: string
    cancelLabel?: string
    isLoading?: boolean
    onSubmit: () => void
    children: React.ReactNode
    variant?: "default" | "reference"
    className?: string
    bodyClassName?: string
    headerClassName?: string
    footerClassName?: string
}

export function BaseFormModal({
                                  open,
                                  onOpenChange,
                                  title,
                                  description,
                                  icon,
                                  submitLabel,
                                  cancelLabel,
                                  isLoading,
                                  onSubmit,
                                  children,
                                  variant = "default",
                              className,
                              bodyClassName,
                              headerClassName,
                              footerClassName,
                          }: BaseFormModalProps) {
    const { t } = useI18n()
    const isReference = variant === "reference"
    const resolvedSubmitLabel = submitLabel ?? t("common.save")
    const resolvedCancelLabel = cancelLabel ?? t("common.cancel")

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn(
                    isReference
                        ? "flex w-[calc(100%-24px)] max-w-[720px] max-h-[92svh] flex-col overflow-hidden rounded-[18px] border border-slate-200 bg-white p-0 shadow-2xl sm:w-full sm:rounded-[20px] sm:p-0 gap-0"
                        : "w-[calc(100%-32px)] sm:w-full sm:max-w-lg max-h-[90svh] overflow-y-auto left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] rounded-lg",
                    className
                )}
            >
                {isReference ? (
                    <div className={cn("px-4 pb-4 pt-6 sm:px-6 sm:pb-4 sm:pt-6", headerClassName)}>
                        <DialogHeader className="flex-row items-start gap-3 space-y-0 text-left sm:gap-4">
                            {icon && (
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 sm:h-14 sm:w-14">
                                    {icon}
                                </div>
                            )}

                            <div className="min-w-0 flex-1 pt-0.5">
                                <DialogTitle className="text-2xl font-bold leading-tight tracking-normal text-slate-950 sm:text-[26px]">
                                    {title}
                                </DialogTitle>
                                {description && (
                                    <DialogDescription className="mt-1 text-sm leading-5 text-slate-500 sm:text-base sm:leading-6">
                                        {description}
                                    </DialogDescription>
                                )}
                            </div>
                        </DialogHeader>
                    </div>
                ) : (
                    <DialogHeader className={headerClassName}>
                        <DialogTitle>{title}</DialogTitle>
                        {description && <DialogDescription>{description}</DialogDescription>}
                    </DialogHeader>
                )}

                <div className={cn(isReference ? "min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-4" : "space-y-4 my-2", bodyClassName)}>
                    {children}
                </div>

                <DialogFooter
                    className={cn(
                        isReference
                            ? "border-t border-slate-200 bg-white px-4 py-3 sm:px-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:space-x-0"
                            : "flex flex-col-reverse sm:flex-row gap-2 sm:gap-2 justify-end",
                        footerClassName
                    )}
                >
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                        className={isReference ? "h-10 w-full rounded-xl px-6 text-sm sm:h-11 sm:w-auto" : "w-full sm:w-auto"}
                    >
                        {resolvedCancelLabel}
                    </Button>
                    <Button
                        onClick={onSubmit}
                        disabled={isLoading}
                        className={isReference ? "h-10 w-full rounded-xl px-8 text-sm sm:h-11 sm:w-auto" : "w-full sm:w-auto"}
                    >
                        {resolvedSubmitLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
