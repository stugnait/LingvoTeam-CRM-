import { ResetPasswordForm } from "@/src/features/auth/components/ResetPasswordForm"

interface PageProps {
    searchParams: {
        uid?: string
        token?: string
    }
}

export default function ResetPasswordPage({ searchParams }: PageProps) {
    const { uid, token } = searchParams

    if (!uid || !token) {
        return <p>Invalid or expired reset link</p>
    }

    return <ResetPasswordForm uid={uid} token={token} />
}