"use client"

import { ResetPasswordForm } from "@/src/features/auth/components/ResetPasswordForm"
import { useSearchParams } from "next/navigation"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

export default function ResetPasswordPage() {
    const searchParams = useSearchParams()
    const { t } = useI18n()
    const uid = searchParams.get("uid")
    const token = searchParams.get("token")

    if (!uid || !token) {
        return <p>{t("auth.invalidResetLink")}</p>
    }

    return <ResetPasswordForm uid={uid} token={token} />
}
