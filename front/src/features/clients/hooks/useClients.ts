import { useCallback, useState } from "react"
import { clientApi } from "../api"
import type { ExternalOrder } from "../types"
import {translatorOrderApi} from "@/src/features/translator_order/api";

type Step = "loading" | "password" | "order" | "expired"

export function useClients(slug: string) {
    const [step, setStep] = useState<Step>("loading")
    const [order, setOrder] = useState<ExternalOrder | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)

    // ---------------- INIT ----------------

    async function init() {
        try {
            await clientApi.check(slug)
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
            setRemainingAttempts(null)
        } catch (e: any) {
            const data = e  // ← просто e, без .response.data

            if (!data?.message) {
                setError("Помилка з'єднання")
                return
            }

            setError(data.message ?? "Невірний пароль")
            setRemainingAttempts(
                typeof data.remaining_attempts === "number" ? data.remaining_attempts : null
            )
        }
    }

    // ---------------- DOWNLOAD ----------------

    const downloadBlob = (blob: Blob, filename: string) => {
        const url = window.URL.createObjectURL(blob)

        const link = document.createElement("a")
        link.href = url
        link.download = filename

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        window.URL.revokeObjectURL(url)
    }

    const downloadFiles = useCallback(async () => {
        if (!order) {
            setError("Замовлення не знайдено")
            return
        }

        try {
            setError(null)

            // clientApi має повертати Blob
            const blob = await clientApi.downloadFiles(order.id)

            downloadBlob(blob, `order_${order.id}_files.zip`)

        } catch (e: any) {
            setError(e?.message || "Помилка завантаження файлів")
        }
    }, [order])

    return {
        step,
        order,
        error,
        init,
        submitPassword,
        remainingAttempts,
        downloadFiles,
    }
}