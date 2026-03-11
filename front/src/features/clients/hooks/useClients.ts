import { useCallback, useState } from "react"
import { clientApi } from "../api"
import type { ExternalOrder, ExternalOrderFileItem } from "../types"
import {translatorOrderApi} from "@/src/features/translator_order/api";

type Step = "loading" | "password" | "order" | "expired"

export function useClients(slug: string) {
    const [step, setStep] = useState<Step>("loading")
    const [order, setOrder] = useState<ExternalOrder | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)
    const [filesCount, setFilesCount] = useState<number | null>(null)
    const [filesLoading, setFilesLoading] = useState(false)
    const [files, setFiles] = useState<ExternalOrderFileItem[]>([])
    const [downloadLoading, setDownloadLoading] = useState(false)

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
            void refreshFiles(res.order_data.id)
        } catch (e: any) {
            const data = e

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
        downloadFiles,
        filesCount,
        filesLoading,
        files,
        refreshFiles,
        downloadSingleFile,
        downloadLoading,
    }
}
