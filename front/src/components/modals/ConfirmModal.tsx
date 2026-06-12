"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "../ui/dialog"
import { Button } from "../ui/button"
import { cn } from "@/src/lib/utils"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

interface ConfirmModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    confirmLabel?: string
    cancelLabel?: string
    confirmVariant?: "default" | "destructive" | "success" | "warning"
    isLoading?: boolean
    onConfirm: () => void
}

const variantStyles = {
    default: "bg-blue-600 hover:bg-blue-700 text-white",
    destructive: "bg-red-600 hover:bg-red-700 text-white",
    success: "bg-green-600 hover:bg-green-700 text-white",
    warning: "bg-yellow-600 hover:bg-yellow-700 text-white",
}

export function ConfirmModal({
                                 open,
                                 onOpenChange,
                                 title,
                                 description,
                                 confirmLabel,
                                 cancelLabel,
                                 confirmVariant = "default",
                                 isLoading,
                                 onConfirm,
                             }: ConfirmModalProps) {
    const { t } = useI18n()
    const resolvedConfirmLabel = confirmLabel ?? t("common.confirm")
    const resolvedCancelLabel = cancelLabel ?? t("common.cancel")

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100vw-32px)] sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                        className="w-full sm:w-auto"
                    >
                        {resolvedCancelLabel}
                    </Button>
                    <Button
                        className={cn(variantStyles[confirmVariant], "w-full sm:w-auto")}
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                {t("common.loading")}
                            </>
                        ) : (
                            resolvedConfirmLabel
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
