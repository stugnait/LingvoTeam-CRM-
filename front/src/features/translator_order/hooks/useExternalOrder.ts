import { useState } from "react"
import { translatorOrderApi } from "../api"
import type { ExternalOrder } from "../types"

type Step = "loading" | "password" | "order" | "expired"

export function useExternalOrder(slug: string) {
    const [step, setStep] = useState<Step>("loading")
    const [order, setOrder] = useState<ExternalOrder | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

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

    async function uploadFiles(files: File[]) {
        if (!order) {
            setError("Замовлення не знайдено")
            return false
        }

        setIsUploading(true)
        setUploadProgress(0)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('order_id', order.id.toString())

            files.forEach(file => {
                formData.append('files', file)
            })

            // Симуляція прогресу
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90))
            }, 200)

            await translatorOrderApi.uploadFiles(formData)

            clearInterval(progressInterval)
            setUploadProgress(100)

            return true
        } catch (e: any) {
            setError(e?.message || "Помилка завантаження файлів")
            return false
        } finally {
            setIsUploading(false)
            setTimeout(() => setUploadProgress(0), 1000)
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
        uploadFiles,
        remainingAttempts,
    }
}