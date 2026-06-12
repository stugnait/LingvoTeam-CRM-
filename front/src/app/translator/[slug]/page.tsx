"use client"

import { use, useEffect } from "react"
import { useExternalOrder } from "@/src/features/translator_order/hooks/useExternalOrder"
import { PasswordForm } from "@/src/features/translator_order/components/PasswordForm"
import { ExternalOrderView } from "@/src/features/translator_order/components/ExternalOrderView"
import { ExpiredLink } from "@/src/features/translator_order/components/ExpiredLink"
import { LoadingFallback } from "@/src/shared/i18n/LoadingFallback"

export default function TranslatorExternalOrderPage({
                                                        params,
                                                    }: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = use(params)

    const {
        step,
        order,
        error,
        isUploading,
        uploadProgress,
        init,
        submitPassword,
        uploadFiles,
        remainingAttempts,
        completeOrder,
        bannedUntil,
        clearBan // 👈 Дістаємо нашу функцію очищення бану
    } = useExternalOrder(slug)

    useEffect(() => {
        init()
    }, [slug, init])

    if (step === "loading") {
        return <LoadingFallback />
    }

    if (step === "expired") {
        return <ExpiredLink />
    }

    // Показуємо форму і якщо просто пароль, і якщо бан
    if (step === "password" || step === "banned") {
        return <PasswordForm
            onSubmit={submitPassword}
            error={error}
            attempts={remainingAttempts}
            bannedUntil={bannedUntil} // Передаємо час бану
            onBanExpired={clearBan}   // 👈 Розблоковуємо через clearBan
        />
    }

    if (step === "order" && order) {
        return (
            <ExternalOrderView
                order={order}
                onUpload={uploadFiles}
                onComplete={completeOrder}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
                error={error}
            />
        )
    }

    return null
}
