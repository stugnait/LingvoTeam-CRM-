// src/features/auth/components/ForgotPasswordModal.tsx
"use client"

import { Mail } from "lucide-react"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"
import { Label } from "@/src/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/src/components/ui/dialog"
import { useForgotPassword } from "../hooks/useForgotPassword"

interface ForgotPasswordModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ForgotPasswordModal({ open, onOpenChange }: ForgotPasswordModalProps) {
    const { email, setEmail, submit, isLoading, isSuccess, resetForm } = useForgotPassword()

    const handleOpenChange = (value: boolean) => {
        if (!value) {resetForm()}
        onOpenChange(value)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Forgot password</DialogTitle>
                    <DialogDescription>
                        Enter your email and we&#39;ll send you a reset link.
                    </DialogDescription>
                </DialogHeader>

                {isSuccess ? (
                    <div className="flex flex-col items-center gap-3 py-4 text-center">
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <Mail className="h-6 w-6 text-green-600" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Check your inbox — we&#39;ve sent the reset instructions.
                        </p>
                        <Button variant="outline" onClick={() => handleOpenChange(false)}>
                            Close
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="forgot-email">Email</Label>
                            <div className="relative">
                                <Input
                                    id="forgot-email"
                                    type="email"
                                    placeholder="some@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                    className="pl-10"
                                    onKeyDown={(e) => e.key === "Enter" && submit()}
                                />
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button onClick={submit} disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                                        Sending...
                                    </>
                                ) : (
                                    "Send reset link"
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}