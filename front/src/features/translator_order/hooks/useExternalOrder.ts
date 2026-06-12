import { useState, useCallback } from "react"
import { translatorOrderApi } from "../api"
import type { ExternalOrder } from "../types"

type Step = "loading" | "password" | "order" | "expired" | "banned"

const BAN_STORAGE_KEY = "external_order_ban_until"

function getFallbackBanDate(): string {
    const t = new Date()
    t.setMinutes(t.getMinutes() + 15)
    return t.toISOString()
}

export function useExternalOrder(slug: string) {
    const [step, setStep] = useState<Step>("loading")
    const [order, setOrder] = useState<ExternalOrder | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)

    const [bannedUntil, setBannedUntil] = useState<string | null>(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem(BAN_STORAGE_KEY)
        }
        return null
    })

    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    const updateBanStatus = useCallback((date: string | null) => {
        setBannedUntil(date)
        if (date) {
            localStorage.setItem(BAN_STORAGE_KEY, date)
            setStep("banned")
        } else {
            localStorage.removeItem(BAN_STORAGE_KEY)
            setStep("password")
        }
    }, [])

    const init = useCallback(async () => {
        if (bannedUntil) {
            const isExpired = new Date(bannedUntil).getTime() < Date.now()
            if (!isExpired) {
                setStep("banned")
                return
            } else {
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
            if (e?.banned_to || e?.banned_until || e?.status === "banned") {
                const banDate = e.banned_to || e.banned_until || getFallbackBanDate()
                updateBanStatus(banDate)
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
                // u
                //pdateBanStatus(null)
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

            // Перевіряємо бан: поле banned_to з бекенду, або текст повідомлення
            const isBanResponse =
                !!data?.banned_to ||
                !!data?.banned_until ||
                data?.status === "banned" ||
                errorMessage.toLowerCase().includes("перевищено") ||
                errorMessage.toLowerCase().includes("заблоковано") ||
                errorMessage.toLowerCase().includes("blocked")

            if (isBanResponse) {
                const banDate = data?.banned_to || data?.banned_until || getFallbackBanDate()
                updateBanStatus(banDate)
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
        onBanExpired: () => updateBanStatus(null),
        clearBan: () => updateBanStatus(null)
    }
}