"use client"

import { use, useEffect } from "react"
import { useExternalOrder } from "@/src/features/translator_order/hooks/useExternalOrder"
import { PasswordForm } from "@/src/features/translator_order/components/PasswordForm"
import { ExternalOrderView } from "@/src/features/translator_order/components/ExternalOrderView"
import { ExpiredLink } from "@/src/features/translator_order/components/ExpiredLink"

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
        remainingAttempts
    } = useExternalOrder(slug)

    useEffect(() => {
        init()
    }, [slug])

    if (step === "loading") {
        return <>Loading...</>
    }

    if (step === "expired") {
        return <ExpiredLink />
    }

    if (step === "password") {
        return <PasswordForm
            onSubmit={submitPassword}
            error={error}
            attempts={remainingAttempts ?? 0}
        />
    }

    return (
        <ExternalOrderView
            order={order!}
            onUpload={uploadFiles}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            error={error}
        />
    )
}