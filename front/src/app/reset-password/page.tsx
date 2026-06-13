"use client"

import { Suspense } from "react"
import { ResetPasswordForm } from "@/src/features/auth/components/ResetPasswordForm"
import { useSearchParams } from "next/navigation"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

function ResetPasswordContent() {
    const searchParams = useSearchParams()
    const { t } = useI18n()
    const uid = searchParams.get("uid")
    const token = searchParams.get("token")

    if (!uid || !token) {
        return <p>{t("auth.invalidResetLink")}</p>
    }

    return <ResetPasswordForm uid={uid} token={token} />
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={null}>
            <ResetPasswordContent />
        </Suspense>
    )
}