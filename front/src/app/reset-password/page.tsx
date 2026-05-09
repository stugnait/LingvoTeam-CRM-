import { ResetPasswordForm } from "@/src/features/auth/components/ResetPasswordForm"

interface PageProps {
    searchParams: Promise<{
        uid?: string
        token?: string
    }>
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
    const { uid, token } = await searchParams

    if (!uid || !token) {
        return <p>Invalid or expired reset link</p>
    }

    return <ResetPasswordForm uid={uid} token={token} />
}