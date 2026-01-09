// src/features/auth/components/ForgotPasswordModal.tsx
"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Mail, CheckCircle } from "lucide-react"

interface ForgotPasswordModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ForgotPasswordModal({ open, onOpenChange }: ForgotPasswordModalProps) {
    const [email, setEmail] = useState("")
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))

        setIsSubmitted(true)
        setIsLoading(false)
    }

    const handleClose = () => {
        onOpenChange(false)
        setTimeout(() => {
            setEmail("")
            setIsSubmitted(false)
        }, 300)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                {!isSubmitted ? (
                    <>
                        <DialogHeader>
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                <Mail className="h-6 w-6 text-primary" />
                            </div>
                            <DialogTitle className="text-center text-xl font-semibold">
                                Reset your password
                            </DialogTitle>
                            <DialogDescription className="text-center">
                                Enter your email address and we'll send you a link to reset your password.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="reset-email">Email address</Label>
                                <div className="relative">
                                    <Input
                                        id="reset-email"
                                        type="email"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="pl-10"
                                    />
                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={handleClose}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1"
                                    disabled={isLoading || !email}
                                >
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
                        </form>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                                <CheckCircle className="h-6 w-6 text-emerald-600" />
                            </div>
                            <DialogTitle className="text-center text-xl font-semibold">
                                Check your email
                            </DialogTitle>
                            <DialogDescription className="text-center">
                                We've sent a password reset link to{" "}
                                <span className="font-medium text-foreground">{email}</span>.
                                Please check your inbox and follow the instructions.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="rounded-lg bg-muted/50 p-4">
                                <p className="text-sm text-muted-foreground">
                                    Didn't receive the email? Check your spam folder or{" "}
                                    <button
                                        onClick={() => setIsSubmitted(false)}
                                        className="text-primary hover:underline font-medium"
                                    >
                                        try again
                                    </button>
                                    .
                                </p>
                            </div>

                            <Button
                                onClick={handleClose}
                                className="w-full"
                            >
                                Return to login
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}