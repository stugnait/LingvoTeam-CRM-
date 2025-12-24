"use client"

import { useSearchParams } from "next/navigation"
import { ResetPasswordForm } from "@/src/features/auth/components/ResetPasswordForm"

export default function ResetPasswordPage() {
    const searchParams = useSearchParams()

    const uid = searchParams.get("uid")
    const token = searchParams.get("token")

    if (!uid || !token) {
        return <p>Invalid or expired reset link</p>
    }

    return <ResetPasswordForm uid={uid} token={token} />
}
