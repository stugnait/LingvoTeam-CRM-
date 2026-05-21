import { useCallback, useState } from "react"
import { clientApi } from "../api"
import type { ExternalOrder, ExternalOrderFileItem } from "../types"
import { translatorOrderApi } from "@/src/features/translator_order/api"

// Додали тип "banned" сюди
type Step = "loading" | "password" | "order" | "expired" | "banned"

// Окремий ключ у LocalStorage суто для клієнтів, щоб не зламати транслейторів
const CLIENT_BAN_STORAGE_KEY = "client_order_ban_until"

export function useClients(slug: string) {
    const [step, setStep] = useState<Step>("loading")
    const [order, setOrder] = useState<ExternalOrder | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)
    const [filesCount, setFilesCount] = useState<number | null>(null)
    const [filesLoading, setFilesLoading] = useState(false)
    const [files, setFiles] = useState<ExternalOrderFileItem[]>([])
    const [downloadLoading, setDownloadLoading] = useState(false)

    // Читаємо збережений бан клієнта з браузера при завантаженні
    const [bannedUntil, setBannedUntil] = useState<string | null>(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem(CLIENT_BAN_STORAGE_KEY)
        }
        return null
    })

    // Функція, яка залізобетонно оновить стейт і localStorage
    const updateBanStatus = useCallback((date: string | null) => {
        setBannedUntil(date)
        if (date) {
            localStorage.setItem(CLIENT_BAN_STORAGE_KEY, date)
            setStep("banned")
        } else {
            localStorage.removeItem(CLIENT_BAN_STORAGE_KEY)
            setStep("password")
        }
    }, [])

    const refreshFiles = async (orderId: number) => {
        setFilesLoading(true)
        try {
            const res = await clientApi.listDownloadFiles(orderId)
            const nextFiles = Array.isArray(res?.files) ? res.files : []
            setFiles(nextFiles)
            setFilesCount(typeof res?.count === "number" ? res.count : nextFiles.length)
        } catch {
            setFiles([])
            setFilesCount(0)
        } finally {
            setFilesLoading(false)
        }
    }

    // ---------------- INIT ----------------

    const init = useCallback(async () => {
        // Перевіряємо локальний бан клієнта перед запитом
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
            // Викликаємо твою перевірку клієнта
            const res = await clientApi.check(slug) as any

            // Якщо раптом бекенд каже, що вже заблоковано
            if (res?.status === "banned" || res?.banned_until) {
                updateBanStatus(res.banned_until || new Date(Date.now() + 15 * 60 * 1000).toISOString())
                return
            }

            // Встановлюємо 3 спроби за замовчуванням (або те, що каже сервер)
            setRemainingAttempts(res?.remaining_attempts ?? 3)
            setStep("password")
        } catch (e: any) {
            // Перестраховка: якщо check впав з баном
            if (e?.status === "banned" || e?.banned_until) {
                updateBanStatus(e.banned_until)
            } else {
                setStep("expired")
            }
        }
    }, [slug, bannedUntil, updateBanStatus])

    async function submitPassword(password: string) {
        try {
            const res = await clientApi.login(slug, { password })

            if (res.status === "granted" || res.access === "granted" || res.order_data) {
                setOrder(res.order_data)
                setStep("order")
                setError(null)
                setRemainingAttempts(null)
                // updateBanStatus(null)
                void refreshFiles(res.order_data.id)
            }
        } catch (e: any) {
            const data = e
            const errorMessage = data?.message || data?.detail || "Невірний пароль"
            setError(errorMessage)

            // 1. Рахуємо, скільки спроб має залишитись
            let nextAttempts: number;
            if (typeof data?.remaining_attempts === "number") {
                nextAttempts = data.remaining_attempts; // Пріоритет тому, що каже сервер
            } else {
                // Якщо сервер мовчить, віднімаємо 1 від поточного
                const current = (remainingAttempts !== null && remainingAttempts !== undefined) ? remainingAttempts : 3;
                nextAttempts = current - 1;
            }

            // 2. Перевіряємо, чи пора банити
            const shouldBan = data?.status === "banned" ||
                data?.banned_until ||
                nextAttempts <= 0 ||
                errorMessage.toLowerCase().includes("заблоковано") ||
                errorMessage.toLowerCase().includes("blocked");

            if (shouldBan) {
                // Якщо бан — ставимо час і фіксуємо 0 спроб (НЕ 3!)
                const finalBanTime = data?.banned_until || new Date(Date.now() + 15 * 60 * 1000).toISOString()
                updateBanStatus(finalBanTime)
                setRemainingAttempts(0)
            } else {
                // Якщо ще є спроби — просто оновлюємо цифру
                setRemainingAttempts(nextAttempts)
            }
        }
    } // <-- Тут була зайва дужка, я її прибрав

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
            setDownloadLoading(true)

            const blob = await clientApi.downloadFiles(order.id)

            downloadBlob(blob, `order_${order.id}_final_files.zip`)

        } catch (e: any) {
            if (e?.detail === "Файлів ще немає.") {
                setFilesCount(0)
                setFiles([])
                setError(null)
                return
            }
            setError(e?.message || e?.detail || "Помилка завантаження файлів")
        } finally {
            setDownloadLoading(false)
        }
    }, [order])

    const downloadSingleFile = useCallback(
        async (fileId: number, filename: string) => {
            if (!order) {
                setError("Замовлення не знайдено")
                return
            }

            try {
                setError(null)
                setDownloadLoading(true)
                const blob = await clientApi.downloadFile(order.id, fileId)
                downloadBlob(blob, filename)
            } catch (e: any) {
                setError(e?.message || e?.detail || "Помилка завантаження файлу")
            } finally {
                setDownloadLoading(false)
            }
        },
        [order]
    )

    return {
        step,
        order,
        error,
        init,
        submitPassword,
        remainingAttempts,
        bannedUntil,
        // 👇 Ось тут ми знімаємо бан і повертаємо 3 спроби:
        onBanExpired: () => {
            updateBanStatus(null);
            setRemainingAttempts(3);
        },
        downloadFiles,
        filesCount,
        filesLoading,
        files,
        refreshFiles,
        downloadSingleFile,
        downloadLoading,
    }
}
