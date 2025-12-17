"use client"

import { SignupForm } from "./SignupForm"
import { AuthLayout } from "./AuthLayout"

export function SignupPage() {
    return (
        <AuthLayout
            title="Create your account"
            description="Get started with your translation management system"
            footerText="Already have an account?"
            footerLinkText="Sign in"
            footerLinkHref="/login"
        >
            <SignupForm />
        </AuthLayout>
    )
}
