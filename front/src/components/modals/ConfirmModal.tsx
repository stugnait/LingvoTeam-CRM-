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
                                 confirmLabel = "Підтвердити",
                                 cancelLabel = "Скасувати",
                                 confirmVariant = "default",
                                 isLoading,
                                 onConfirm,
                             }: ConfirmModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        className={variantStyles[confirmVariant]}
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Завантаження...
                            </>
                        ) : (
                            confirmLabel
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}