import { useState } from "react"
import { translatorOrderApi } from "../api"
import type { ExternalOrder } from "../types"

type Step = "loading" | "password" | "order" | "expired"

export function useExternalOrder(slug: string) {
    const [step, setStep] = useState<Step>("loading")
    const [order, setOrder] = useState<ExternalOrder | null>(null)
    const [error, setError] = useState<string | null>(null)

    async function init() {
        try {
            await translatorOrderApi.check(slug)
            setStep("password")
        } catch {
            setStep("expired")
        }
    }

    async function submitPassword(password: string) {
        try {
            const res = await translatorOrderApi.login(slug, { password })
            setOrder(res.order_data)
            setStep("order")
            setError(null)
        } catch (e: any) {
            setError(e?.message || "Невірний пароль")
        }
    }

    return {
        step,
        order,
        error,
        init,
        submitPassword,
    }
}
