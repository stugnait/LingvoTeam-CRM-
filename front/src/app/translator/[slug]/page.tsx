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
    const { slug } = use(params) // Розв'язуємо Promise за допомогою use()

    const { step, order, error, init, submitPassword } = useExternalOrder(slug)

    useEffect(() => {
        init()
    }, [slug])

    if (step === "loading") {return <>Loading...</>}
    if (step === "expired") {return <ExpiredLink />}
    if (step === "password") {return <PasswordForm onSubmit={submitPassword} error={error} />}

    return <ExternalOrderView order={order!} />
}