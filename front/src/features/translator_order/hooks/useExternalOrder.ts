import { useState, useCallback } from "react"
import { translatorOrderApi } from "../api"
import type { ExternalOrder } from "../types"

type Step = "loading" | "password" | "order" | "expired" | "banned"

// Ключ для збереження часу бану в браузері
const BAN_STORAGE_KEY = "external_order_ban_until"

export function useExternalOrder(slug: string) {
    const [step, setStep] = useState<Step>("loading")
    const [order, setOrder] = useState<ExternalOrder | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)

    // Ініціалізація стану: перевіряємо localStorage при першому рендері
    const [bannedUntil, setBannedUntil] = useState<string | null>(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem(BAN_STORAGE_KEY)
        }
        return null
    })

    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    // Функція-хелпер для встановлення бану і в стейт, і в сховище
    const updateBanStatus = useCallback((date: string | null) => {
        setBannedUntil(date)
        if (date) {
            localStorage.setItem(BAN_STORAGE_KEY, date)
            setStep("banned")
        } else {
            localStorage.removeItem(BAN_STORAGE_KEY)
        }
    }, [])

    const init = useCallback(async () => {
        // 1. Перевіряємо локальний бан перед запитом
        if (bannedUntil) {
            const isExpired = new Date(bannedUntil).getTime() < Date.now()
            if (!isExpired) {
                setStep("banned")
                return // Виходимо, запит робити не потрібно
            } else {
                // Якщо час вийшов, очищуємо локальний бан
                updateBanStatus(null)
            }
        }

        try {
            const res = await translatorOrderApi.check(slug)

            if (res.status === "granted" && res.order_data) {
                setOrder(res.order_data)
                setStep("order")
            } else if (res.status === "awaiting_password") {
                setRemainingAttempts(res.remaining_attempts ?? 3)
                setStep("password")
            }
        } catch (e: any) {
            if (e?.status === "banned" || e?.banned_until || e?.banned_to) {
                updateBanStatus(e.banned_until || e.banned_to)
            } else {
                setStep("expired")
            }
        }
    }, [slug, bannedUntil, updateBanStatus])

    async function submitPassword(password: string) {
        try {
            const res = await translatorOrderApi.login(slug, { password })

            if (res.status === "granted" || res.access === "granted") {
                if (res.order_data) {
                    setOrder(res.order_data)
                    setStep("order")
                } else {
                    await init()
                    return
                }
                setError(null)
                setRemainingAttempts(null)
                updateBanStatus(null) // Очищуємо бан при успішному вході
            }
        } catch (e: any) {
            const data = e
            const errorMessage = data?.message || data?.detail || data?.error

            if (!errorMessage) {
                setError("Помилка з'єднання")
                return
            }

            setError(errorMessage)

            if (data?.remaining_attempts !== undefined) {
                setRemainingAttempts(data.remaining_attempts)
            }

            if (data?.banned_until || data?.banned_to || data?.status === "banned") {
                updateBanStatus(data.banned_until || data.banned_to)
            }
            else if (errorMessage.toLowerCase().includes("заблоковано") || errorMessage.toLowerCase().includes("blocked")) {
                const banTime = new Date()
                banTime.setMinutes(banTime.getMinutes() + 15)
                updateBanStatus(banTime.toISOString())
            }
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

    async function completeOrder() {
        if (!order) return false
        try {
            await translatorOrderApi.completeOrder(order.id)
            setOrder({ ...order, status_id: 10, status: "completed" } as any)
            return true
        } catch (e: any) {
            setError(e?.message || "Помилка при зміні статусу")
            return false
        }
    }

    return {
        step,
        setStep,
        order,
        error,
        isUploading,
        uploadProgress,
        init,
        submitPassword,
        uploadFiles,
        completeOrder,
        remainingAttempts,
        bannedUntil,
        // Додаємо колбек для скидання бану, щоб передати його в PasswordForm
        onBanExpired: () => updateBanStatus(null),
        clearBan: () => updateBanStatus(null)
    }
}