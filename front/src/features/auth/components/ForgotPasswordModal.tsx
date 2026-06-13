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
import { useI18n } from "@/src/shared/i18n/I18nProvider"

interface ForgotPasswordModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ForgotPasswordModal({ open, onOpenChange }: ForgotPasswordModalProps) {
    const { email, setEmail, submit, isLoading, isSuccess, resetForm } = useForgotPassword()
    const { t } = useI18n()

    const handleOpenChange = (value: boolean) => {
        if (!value) { resetForm() }
        onOpenChange(value)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            {/* w-[calc(100%-2rem)] — модалка з відступами на мобільному */}
            <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md rounded-xl">
                <DialogHeader>
                    <DialogTitle>{t("auth.forgotPassword")}</DialogTitle>
                    <DialogDescription>
                        {t("auth.forgotPasswordDescription")}
                    </DialogDescription>
                </DialogHeader>

                {isSuccess ? (
                    <div className="flex flex-col items-center gap-3 py-4 text-center">
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <Mail className="h-6 w-6 text-green-600" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {t("auth.checkInbox")}
                        </p>
                        <Button variant="outline" onClick={() => handleOpenChange(false)} className="w-full sm:w-auto">
                            {t("common.close")}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="forgot-email">{t("auth.email")}</Label>
                            <div className="relative">
                                <Input
                                    id="forgot-email"
                                    type="email"
                                    placeholder="some@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                    // h-11 + text-base — запобігає зуму на iOS
                                    className="pl-10 h-11 text-base sm:text-sm"
                                    onKeyDown={(e) => e.key === "Enter" && submit()}
                                />
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        {/* На мобільному — кнопки стекуються, Cancel знизу (flex-col-reverse) */}
                        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-1">
                            <Button
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={isLoading}
                                className="w-full sm:w-auto"
                            >
                                {t("common.cancel")}
                            </Button>
                            <Button
                                onClick={submit}
                                disabled={isLoading}
                                className="w-full sm:w-auto"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                                        {t("auth.sending")}
                                    </>
                                ) : (
                                    t("auth.sendResetLink")
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
