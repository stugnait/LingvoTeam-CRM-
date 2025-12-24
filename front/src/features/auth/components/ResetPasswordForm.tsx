"use client"

import { useState } from "react"
import { BaseFormModal } from "@/src/components/modals/BaseFormModal"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { CheckCircle2 } from "lucide-react"
import { useResetPassword } from "../hooks/useResetPassword"
import { useRouter } from "next/navigation"

interface ResetPasswordFormProps {
    uid: string
    token: string
}

export function ResetPasswordForm({ uid, token }: ResetPasswordFormProps) {
    const router = useRouter()

    const [password, setPassword] = useState("")
    const [confirm, setConfirm] = useState("")
    const [successOpen, setSuccessOpen] = useState(false)

    const { submit, isLoading } = useResetPassword({ uid, token })

    const onSubmit = async () => {
        if (password !== confirm) {
            return
        }

        const ok = await submit(password, confirm)

        if (ok) {
            setSuccessOpen(true)
        }
    }

    const handleCloseSuccess = () => {
        setSuccessOpen(false)
        router.replace("/login") // або "/"
    }

    return (
        <>
            {/* ===== SUCCESS MODAL ===== */}
            <BaseFormModal
                open={successOpen}
                onOpenChange={handleCloseSuccess}
                title="Password updated"
                submitLabel="Go to login"
                cancelLabel=""
                onSubmit={handleCloseSuccess}
            >
                <div className="space-y-4 text-center py-4">
                    <div className="flex justify-center">
                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Your password has been successfully changed.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            You can now sign in with your new password.
                        </p>
                    </div>
                </div>
            </BaseFormModal>

            {/* ===== RESET PASSWORD FORM ===== */}
            <BaseFormModal
                open
                onOpenChange={() => {}}
                title="Reset password"
                submitLabel={isLoading ? "Saving..." : "Save new password"}
                cancelLabel=""
                isLoading={isLoading}
                onSubmit={onSubmit}
            >
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                        Enter your new password below.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="new-password">New password</Label>
                    <Input
                        id="new-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm password</Label>
                    <Input
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        disabled={isLoading}
                        required
                    />
                </div>
            </BaseFormModal>
        </>
    )
}
