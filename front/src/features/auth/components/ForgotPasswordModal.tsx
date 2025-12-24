// src/features/auth/components/ForgotPasswordModal.tsx
"use client"

import { BaseFormModal } from "@/src/components/modals/BaseFormModal"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { CheckCircle2 } from "lucide-react"
import { useForgotPassword } from "../hooks/useForgotPassword"

interface ForgotPasswordModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ForgotPasswordModal({
                                        open,
                                        onOpenChange,
                                    }: ForgotPasswordModalProps) {
    const {
        email,
        setEmail,
        submit,          // ⬅️ замість handleSubmit
        isLoading,
        isSuccess,
        resetForm,
    } = useForgotPassword()

    const handleClose = () => {
        onOpenChange(false)

        // Скидаємо форму після закриття анімації
        setTimeout(() => {
            resetForm()
        }, 300)
    }

    const onSubmit = async () => {
        await submit()
    }

    if (isSuccess) {
        return (
            <BaseFormModal
                open={open}
                onOpenChange={handleClose}
                title="Check your email"
                submitLabel="Close"
                cancelLabel=""
                onSubmit={handleClose}
            >
                <div className="space-y-4 text-center py-4">
                    <div className="flex justify-center">
                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            We've sent password reset instructions to{" "}
                            <span className="font-medium text-foreground">
                                {email}
                            </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Check your inbox and follow the link to reset your
                            password.
                        </p>
                    </div>
                </div>
            </BaseFormModal>
        )
    }

    return (
        <BaseFormModal
            open={open}
            onOpenChange={handleClose}
            title="Forgot password?"
            submitLabel={isLoading ? "Sending..." : "Send reset link"}
            cancelLabel="Cancel"
            isLoading={isLoading}
            onSubmit={onSubmit}
        >
            <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                    Enter your email address and we'll send you instructions to
                    reset your password.
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                    id="forgot-email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="email"
                />
            </div>
        </BaseFormModal>
    )
}
