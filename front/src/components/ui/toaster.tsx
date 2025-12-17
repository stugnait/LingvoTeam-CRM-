"use client"

import {
    Toast,
    ToastDescription,
    ToastTitle,
    ToastViewport,
    ToastProvider,
} from "@/src/components/ui/toast"
import { useToast } from "@/src/hooks/use-toast"

export function Toaster() {
    const { toasts } = useToast()

    return (
        <ToastProvider>
            {toasts.map(({ id, title, description, action, ...props }) => (
                <Toast key={id} {...props}>
                    <div className="grid gap-1">
                        {title && <ToastTitle>{title}</ToastTitle>}
                        {description && (
                            <ToastDescription>{description}</ToastDescription>
                        )}
                    </div>
                    {action}
                </Toast>
            ))}
            <ToastViewport />
        </ToastProvider>
    )
}
