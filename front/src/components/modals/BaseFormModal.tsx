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
            <DialogContent className="w-[calc(100%-32px)] sm:w-full sm:max-w-lg max-h-[90svh] overflow-y-auto left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] rounded-lg">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 my-2">
                    {children}
                </div>

                <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-2 justify-end">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                        className="w-full sm:w-auto"
                    >
                        {cancelLabel}
                    </Button>
                    <Button onClick={onSubmit} disabled={isLoading} className="w-full sm:w-auto">
                        {submitLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
