"use client"

import { use, useEffect } from "react"
import { useClients } from "@/src/features/clients/hooks/useClients"
import { PasswordForm } from "@/src/features/translator_order/components/PasswordForm"
import { MainClient } from "@/src/features/clients/components/MainClient"
import { ExpiredLink } from "@/src/features/translator_order/components/ExpiredLink"

export default function ClientExternalOrderPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params)

    const {
        step,
        order,
        error,
        init,
        submitPassword,
        remainingAttempts,
        bannedUntil,
        onBanExpired,
        files,
        filesLoading,
        downloadFiles,
        downloadLoading
    } = useClients(slug)

    useEffect(() => {
        init()
    }, [slug, init])

    if (step === "loading") {
        return <div className="p-10 text-center text-muted-foreground animate-pulse">Завантаження...</div>
    }

    if (step === "expired") {
        return <ExpiredLink />
    }

    if (step === "password" || step === "banned") {
        return (
            <PasswordForm
                onSubmit={submitPassword}
                error={error}
                attempts={remainingAttempts}
                bannedUntil={bannedUntil}
                onBanExpired={onBanExpired}
            />
        )
    }

    if (step === "order" && order) {
        return (
            <MainClient
                order={order}
                files={files}
                filesLoading={filesLoading}
                onDownload={downloadFiles}
                downloadLoading={downloadLoading}
            />
        )
    }

    return null
}
