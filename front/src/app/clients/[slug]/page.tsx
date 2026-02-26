"use client"

import { use, useEffect } from "react"
import { useExternalOrder } from "@/src/features/translator_order/hooks/useExternalOrder"
import { useClients } from "@/src/features/clients/hooks/useClients"
import { PasswordForm } from "@/src/features/translator_order/components/PasswordForm"
import { MainClient } from "@/src/features/clients/components/MainClient"
import { ExpiredLink } from "@/src/features/translator_order/components/ExpiredLink"

export default function ClientExternalOrderPage({
                                                    params,
                                                }: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = use(params)

    const {
        step,
        order,
        error,
        init,
        submitPassword,
        downloadFiles
    } = useClients(slug)

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
        return (
            <PasswordForm
                onSubmit={submitPassword}
                error={error}
            />
        )
    }

    if (step === "order" && order) {
        return (
            <MainClient
                order={order}
                error={error}
                onDownload={downloadFiles}
            />
        )
    }

    return null
}