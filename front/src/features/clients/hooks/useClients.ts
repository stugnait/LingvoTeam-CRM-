import { useState } from "react"
import { clientApi } from "../api"
import type { ExternalOrder } from "../types"

type Step = "loading" | "password" | "order" | "expired"

export function useClients(slug: string) {
    const [step, setStep] = useState<Step>("loading")
    const [order, setOrder] = useState<ExternalOrder | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    // 1️⃣ Перевірка slug
    async function init() {
        try {
            await clientApi.check(slug)
            setStep("password")
        } catch (e: any) {
            setStep("expired")
        }
    }

    // 2️⃣ Логін по паролю
    async function submitPassword(password: string) {
        try {
            const res = await clientApi.login(slug, { password })

            // 👇 ВАЖЛИВО: залежить від структури відповіді
            setOrder(res.order_data)
            setStep("order")
            setError(null)

        } catch (e: any) {
            setError(e?.message || "Невірний пароль")
        }
    }

    // 4️⃣ Завантаження файлів (download)
    async function downloadFiles() {
        if (!order) {
            setError("Замовлення не знайдено")
            return
        }

        try {
            const response = await clientApi.downloadFiles(order.id)

            if (!response.ok) {
                throw new Error("Помилка завантаження")
            }

            const blob = await response.blob()

            // 👉 пробуємо витягнути ім'я файлу з header
            const contentDisposition = response.headers.get("Content-Disposition")
            let fileName = `order_${order.id}`

            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?(.+)"?/)
                if (match?.[1]) {
                    fileName = match[1]
                }
            }

            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = fileName
            document.body.appendChild(a)
            a.click()
            a.remove()

            window.URL.revokeObjectURL(url)

        } catch (e: any) {
            setError(e?.message || "Помилка завантаження файлів")
        }
    }

    return {
        step,
        order,
        error,
        isUploading,
        uploadProgress,
        init,
        submitPassword,
        downloadFiles,
    }
}