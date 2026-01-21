"use client"

import { LoginForm } from "./LoginForm"
import { AuthLayout } from "./AuthLayout"

export function LoginPage() {
    return (
        <AuthLayout
            title="Welcome back"
            description="Sign in to your account to continue"
        >
            <LoginForm />
        </AuthLayout>
    )
}
