"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../ui/dialog"
import { Button } from "../ui/button"

interface BaseFormModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    submitLabel?: string
    cancelLabel?: string
    isLoading?: boolean
    onSubmit: () => void
    children: React.ReactNode
}

export function BaseFormModal({
                                  open,
                                  onOpenChange,
                                  title,
                                  submitLabel = "Save",
                                  cancelLabel = "Cancel",
                                  isLoading,
                                  onSubmit,
                                  children,
                              }: BaseFormModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {children}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        {cancelLabel}
                    </Button>
                    <Button onClick={onSubmit} disabled={isLoading}>
                        {submitLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
