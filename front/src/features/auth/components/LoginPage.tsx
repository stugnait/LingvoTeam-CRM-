"use client"

"use client"

import { LoginForm } from "./LoginForm"
import { AuthLayout } from "./AuthLayout"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

export function LoginPage() {
    const { t } = useI18n()

    return (
        <AuthLayout
            title={t("auth.welcomeBack")}
            description={t("auth.loginDescription")}
            footerText={t("auth.signupPrompt")}
            footerLinkText={t("auth.signup")}
            footerLinkHref="/register"
        >
            <LoginForm />
        </AuthLayout>
    )
}
