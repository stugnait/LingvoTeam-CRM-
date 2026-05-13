"use client"

import type { ExternalOrder, ExternalOrderFileItem } from "../types"
import { translatorOrderApi } from "../api"
import {
    Calendar,
    MessageSquare,
    Languages,
    FileText,
    Upload,
    X,
    CheckCircle2,
    AlertCircle,
    Hourglass,
    AlertTriangle,
    FileUp,
    Eye,
    Trash2,
    Archive,
    Check
} from "lucide-react"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Progress } from "@/src/components/ui/progress"
import { useEffect, useRef, useState } from "react"
import { useCountdown } from "../hooks/useCountdown"
import { ConfirmModal } from "@/src/components/modals/ConfirmModal"

interface Props {
    order: ExternalOrder
    onUpload: (files: File[]) => Promise<boolean>
    onDelete?: () => Promise<boolean>
    onArchive?: () => Promise<boolean>
    onComplete?: () => Promise<boolean>
    isUploading: boolean
    uploadProgress: number
    error?: string | null
}

export function ExternalOrderView({
                                      order,
                                      onUpload,
                                      onDelete,
                                      onArchive,
                                      onComplete,
                                      isUploading,
                                      uploadProgress,
                                      error,
                                  }: Props) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [uploadSuccess, setUploadSuccess] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [modalConfig, setModalConfig] = useState<{
        title: string
        description: string
        confirmLabel: string
        confirmVariant: "default" | "destructive" | "success" | "warning"
        onConfirm: () => void
    }>({
        title: "",
        description: "",
        confirmLabel: "Підтвердити",
        confirmVariant: "default",
        onConfirm: () => {},
    })
    const fileInputRef = useRef<HTMLInputElement>(null)

    const countdown = useCountdown(order.deadline)
    const pad = (num: number) => String(num).padStart(2, "0")

    const [sourceFiles, setSourceFiles] = useState<ExternalOrderFileItem[]>([])
    const [targetFiles, setTargetFiles] = useState<ExternalOrderFileItem[]>([])
    const [filesLoading, setFilesLoading] = useState(false)
    const [filesError, setFilesError] = useState<string | null>(null)
    const [downloadLoading, setDownloadLoading] = useState(false)

    // Перевірка, чи статус є завершеним
    const isCompleted = order.status_id === 10

    const refreshFiles = async () => {
        setFilesLoading(true)
        setFilesError(null)
        try {
            const results = await Promise.allSettled([
                translatorOrderApi.listDownloadFiles(order.id, "source"),
                translatorOrderApi.listDownloadFiles(order.id, "target"),
            ])

            const isFolderEmptyError = (err: any) =>
                typeof err?.detail === "string" &&
                err.detail.includes("Файли") &&
                err.detail.includes("відсутні")

            const [sourceResult, targetResult] = results

            if (sourceResult.status === "fulfilled") {
                setSourceFiles(sourceResult.value.files ?? [])
            } else if (isFolderEmptyError(sourceResult.reason)) {
                setSourceFiles([])
            }

            if (targetResult.status === "fulfilled") {
                setTargetFiles(targetResult.value.files ?? [])
            } else if (isFolderEmptyError(targetResult.reason)) {
                setTargetFiles([])
            }

            const errors = results
                .filter(r => r.status === "rejected")
                .map(r => (r as PromiseRejectedResult).reason)
                .filter(err => !isFolderEmptyError(err))

            if (errors.length > 0) {
                const err = errors[0]
                setFilesError(err?.message || err?.detail || "Не вдалося завантажити список файлів")
            }
        } finally {
            setFilesLoading(false)
        }
    }

    useEffect(() => {
        void refreshFiles()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [order?.id])

    const downloadBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const handleDownloadSourceFile = async (fileId: number, filename: string) => {
        setDownloadLoading(true)
        setFilesError(null)
        try {
            const blob = await translatorOrderApi.downloadFile(order.id, "source", fileId)
            downloadBlob(blob, filename)
        } catch (e: any) {
            setFilesError(e?.message || "Не вдалося скачати файл (source)")
        } finally {
            setDownloadLoading(false)
        }
    }

    const handleDownloadAllSource = async () => {
        setDownloadLoading(true)
        setFilesError(null)
        try {
            const blob = await translatorOrderApi.downloadAllFiles(order.id, "source")
            downloadBlob(blob, `order_${order.id}_source_files.zip`)
        } catch (e: any) {
            setFilesError(e?.message || "Не вдалося скачати всі файли (source)")
        } finally {
            setDownloadLoading(false)
        }
    }

    const handleDownloadTargetFile = async (fileId: number, filename: string) => {
        setDownloadLoading(true)
        setFilesError(null)
        try {
            const blob = await translatorOrderApi.downloadFile(order.id, "target", fileId)
            downloadBlob(blob, filename)
        } catch (e: any) {
            setFilesError(e?.message || "Не вдалося скачати файл (target)")
        } finally {
            setDownloadLoading(false)
        }
    }

    const handleDownloadAllTarget = async () => {
        setDownloadLoading(true)
        setFilesError(null)
        try {
            const blob = await translatorOrderApi.downloadAllFiles(order.id, "target")
            downloadBlob(blob, `order_${order.id}_target_files.zip`)
        } catch (e: any) {
            setFilesError(e?.message || "Не вдалося скачати всі файли (target)")
        } finally {
            setDownloadLoading(false)
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        setSelectedFiles(prev => [...prev, ...files])
        e.target.value = ""
    }

    const handleRemoveFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return

        setShowConfirmModal(false)
        const success = await onUpload(selectedFiles)
        if (success) {
            setSelectedFiles([])
            if (fileInputRef.current) fileInputRef.current.value = ""
            setUploadSuccess(true)
            setTimeout(() => setUploadSuccess(false), 3000)
            void refreshFiles()
        }
    }

    const handleUploadClick = () => {
        if (selectedFiles.length === 0) return

        setModalConfig({
            title: "Підтвердження завантаження",
            description: `Ви впевнені, що хочете завантажити ${selectedFiles.length} ${
                selectedFiles.length === 1 ? "файл" : "файлів"
            }?`,
            confirmLabel: "Завантажити",
            confirmVariant: "default",
            onConfirm: handleUpload,
        })
        setShowConfirmModal(true)
    }

    const handleDeleteClick = () => {
        if (!onDelete) return
        setModalConfig({
            title: "Видалення замовлення",
            description: "Ви впевнені, що хочете видалити це замовлення? Цю дію неможливо скасувати.",
            confirmLabel: "Видалити",
            confirmVariant: "destructive",
            onConfirm: async () => {
                setShowConfirmModal(false)
                await onDelete()
            },
        })
        setShowConfirmModal(true)
    }

    const handleArchiveClick = () => {
        if (!onArchive) return
        setModalConfig({
            title: "Архівування замовлення",
            description: "Ви впевнені, що хочете перемістити це замовлення в архів?",
            confirmLabel: "Архівувати",
            confirmVariant: "warning",
            onConfirm: async () => {
                setShowConfirmModal(false)
                await onArchive()
            },
        })
        setShowConfirmModal(true)
    }

    const handleCompleteClick = () => {
        if (!onComplete) return
        setModalConfig({
            title: "Відправити на перевірку?",
            description: "Ви підтверджуєте, що завершили роботу і завантажили всі необхідні файли? Замовлення буде передано редактору.",
            confirmLabel: "Відправити",
            confirmVariant: "success",
            onConfirm: async () => {
                setShowConfirmModal(false)
                await onComplete()
            },
        })
        setShowConfirmModal(true)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const files = Array.from(e.dataTransfer.files)
        setSelectedFiles(prev => [...prev, ...files])
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
    }

    const getStatusColor = (status: string | number) => {
        switch (status) {
            case "in_progress": return "bg-blue-500"
            default: return "bg-amber-500"
        }
    }

    const getStatusText = (status: string | number) => {
        switch (status) {
            case "in_progress": return "В роботі"
            default: return "Очікує"
        }
    }

    const CountdownTimer = () => {
        if (countdown.expired) {
            return (
                <div className="mt-4 p-6 rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200 flex items-center gap-4 text-red-800">
                    <div className="p-3 rounded-full bg-red-200">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    <div>
                        <p className="text-xl font-bold mb-1">⛔ Термін виконання вийшов</p>
                        <p className="text-red-600/80">
                            Будь ласка, зв&#39;яжіться з менеджером для уточнення деталей
                        </p>
                    </div>
                </div>
            )
        }

        return (
            <div className="mt-6 bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-blue-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-blue-100">
                        <Hourglass className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-blue-700">Залишилось часу</p>
                        <p className="text-xs text-blue-500">до завершення дедлайну</p>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                    <div className="relative group">
                        <div className="bg-white rounded-2xl p-5 text-center shadow-lg border border-blue-100 group-hover:border-blue-300 group-hover:shadow-xl transition-all duration-300">
                            <div className="text-4xl font-bold text-blue-600 mb-1">{pad(countdown.days)}</div>
                            <div className="text-sm text-blue-400 font-medium">Днів</div>
                        </div>
                    </div>
                    <div className="relative group">
                        <div className="bg-white rounded-2xl p-5 text-center shadow-lg border border-blue-100 group-hover:border-blue-300 group-hover:shadow-xl transition-all duration-300">
                            <div className="text-4xl font-bold text-blue-600 mb-1">{pad(countdown.hours)}</div>
                            <div className="text-sm text-blue-400 font-medium">Годин</div>
                        </div>
                    </div>
                    <div className="relative group">
                        <div className="bg-white rounded-2xl p-5 text-center shadow-lg border border-blue-100 group-hover:border-blue-300 group-hover:shadow-xl transition-all duration-300">
                            <div className="text-4xl font-bold text-blue-600 mb-1">{pad(countdown.minutes)}</div>
                            <div className="text-sm text-blue-400 font-medium">Хвилин</div>
                        </div>
                    </div>
                    <div className="relative group">
                        <div className="bg-white rounded-2xl p-5 text-center shadow-lg border border-blue-100 group-hover:border-blue-300 group-hover:shadow-xl transition-all duration-300">
                            <div className="text-4xl font-bold text-blue-600 mb-1 relative">
                                {pad(countdown.seconds)}
                                <span className="absolute -top-1 -right-2 w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                            </div>
                            <div className="text-sm text-blue-400 font-medium">Секунд</div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ==========================================
    // ПОВНОЕКРАННИЙ РЕЖИМ ПРИ ЗАВЕРШЕННІ РОБОТИ
    // ==========================================
    if (isCompleted) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-white px-4">
                <div className="w-32 h-32 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-green-200/50 animate-bounce">
                    <CheckCircle2 className="w-16 h-16" />
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold text-green-800 mb-6 text-center tracking-tight">
                    Переклад відправлено!
                </h1>
                <p className="text-xl md:text-2xl text-green-600/90 text-center max-w-2xl mb-8 font-medium leading-relaxed">
                    Дякуємо за виконану роботу. Замовлення передано редактору на перевірку. Ви можете закрити цю сторінку.
                </p>
            </div>
        )
    }

    // ==========================================
    // ЗВИЧАЙНИЙ РЕЖИМ (РОБОТА НАД ЗАМОВЛЕННЯМ)
    // ==========================================
    return (
        <div className="max-w-4xl mx-auto mt-8 p-6 animate-fade-in pb-32">
            <ConfirmModal
                open={showConfirmModal}
                onOpenChange={setShowConfirmModal}
                title={modalConfig.title}
                description={modalConfig.description}
                confirmLabel={modalConfig.confirmLabel}
                cancelLabel="Скасувати"
                confirmVariant={modalConfig.confirmVariant}
                isLoading={isUploading}
                onConfirm={modalConfig.onConfirm}
            />

            {/* Хедер */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                            Замовлення #{order.id}
                        </h1>
                        <Badge variant="outline" className="text-sm border-blue-200 bg-blue-50 text-blue-700">
                            Зовнішній доступ
                        </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* статус */}
                        <div className="flex items-center gap-2 mr-4">
                            <div className="relative">
                                <div className={`h-3 w-3 rounded-full ${getStatusColor((order as any).status)} animate-pulse`} />
                                <div className={`absolute inset-0 h-3 w-3 rounded-full ${getStatusColor((order as any).status)} animate-ping opacity-75`} />
                            </div>
                            <span className="font-medium text-sm">
                                {getStatusText((order as any).status)}
                            </span>
                        </div>

                        {onArchive && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleArchiveClick}
                                className="border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                            >
                                <Archive className="h-4 w-4 mr-2" />
                                В архів
                            </Button>
                        )}
                        {onDelete && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDeleteClick}
                                className="border-red-200 text-red-700 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Видалити
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid gap-6">

                {/* Основна інформація */}
                <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-800">
                        <div className="p-2 rounded-lg bg-blue-50">
                            <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <span>Основна інформація</span>
                    </h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-blue-400">
                                <Languages className="h-4 w-4" />
                                <span>Мовна пара</span>
                            </div>
                            <p className="font-medium text-lg bg-blue-50 p-3 rounded-lg border border-blue-100 text-blue-800">
                                {order.language_pair}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-blue-400">
                                <Calendar className="h-4 w-4" />
                                <span>Дедлайн</span>
                            </div>

                            <p className="font-medium text-base mb-3 bg-blue-50 p-3 rounded-lg border border-blue-100 text-blue-800">
                                {new Date(order.deadline).toLocaleString("uk-UA", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </p>
                        </div>
                    </div>

                    <CountdownTimer />
                </div>

                {/* Коментар */}
                <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-800">
                        <div className="p-2 rounded-lg bg-blue-50">
                            <MessageSquare className="h-5 w-5 text-blue-600" />
                        </div>
                        <span>Коментар та деталі</span>
                    </h2>

                    <div className="min-h-[150px] p-5 rounded-lg bg-gradient-to-br from-blue-50 to-white border-2 border-dashed border-blue-200 hover:border-blue-300 transition-colors">
                        {order.comment ? (
                            <div className="prose prose-sm max-w-none">
                                <p className="whitespace-pre-line text-blue-900 leading-relaxed">{order.comment}</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-blue-300 py-8">
                                <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
                                <p className="text-lg font-medium">Коментар відсутній</p>
                                <p className="text-sm">Немає додаткових інструкцій</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Список завантажених файлів */}
                <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-blue-800">
                            <div className="p-2 rounded-lg bg-blue-50">
                                <Eye className="h-5 w-5 text-blue-600" />
                            </div>
                            <span>Файли замовлення</span>
                        </h2>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={refreshFiles}
                            disabled={filesLoading}
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                            Оновити
                        </Button>
                    </div>

                    {filesError && (
                        <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            <span className="text-sm">{filesError}</span>
                        </div>
                    )}

                    <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
                        <div className="flex items-center justify-between mb-3">
                            <p className="font-semibold text-blue-900">Оригінали (Source)</p>
                            <Badge variant="outline" className="border-blue-200 bg-white text-blue-700">
                                {filesLoading ? "..." : sourceFiles.length}
                            </Badge>
                        </div>

                        <div className="space-y-2">
                            {filesLoading ? (
                                <div className="text-sm text-blue-500">Завантаження…</div>
                            ) : sourceFiles.length === 0 ? (
                                <div className="text-sm text-blue-400">Файлів немає</div>
                            ) : (
                                sourceFiles.map(f => (
                                    <div
                                        key={f.id}
                                        className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white border border-blue-100"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-blue-900 truncate">{f.name}</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                            onClick={() => void handleDownloadSourceFile(f.id, f.name)}
                                            disabled={downloadLoading}
                                        >
                                            Скачати
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
                        <div className="flex items-center justify-between mb-3">
                            <p className="font-semibold text-blue-900">Ваш переклад (Target)</p>
                            <Badge variant="outline" className="border-blue-200 bg-white text-blue-700">
                                {filesLoading ? "..." : targetFiles.length}
                            </Badge>
                        </div>

                        <div className="space-y-2">
                            {filesLoading ? (
                                <div className="text-sm text-blue-500">Завантаження…</div>
                            ) : targetFiles.length === 0 ? (
                                <div className="text-sm text-blue-400">Файлів немає</div>
                            ) : (
                                targetFiles.map(f => (
                                    <div
                                        key={f.id}
                                        className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white border border-blue-100"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-blue-900 truncate">{f.name}</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                            onClick={() => void handleDownloadTargetFile(f.id, f.name)}
                                            disabled={downloadLoading}
                                        >
                                            Скачати
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => void handleDownloadAllSource()}
                            disabled={filesLoading || downloadLoading || sourceFiles.length === 0}
                        >
                            <FileUp className="h-4 w-4 mr-2" />
                            Скачати всі оригінали
                        </Button>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => void handleDownloadAllTarget()}
                            disabled={filesLoading || downloadLoading || targetFiles.length === 0}
                        >
                            <FileUp className="h-4 w-4 mr-2" />
                            Скачати всі переклади
                        </Button>
                    </div>
                </div>

                {/* Upload */}
                <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-800">
                        <div className="p-2 rounded-lg bg-blue-50">
                            <Upload className="h-5 w-5 text-blue-600" />
                        </div>
                        <span>Завантаження перекладу</span>
                    </h2>

                    {uploadSuccess && (
                        <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3 text-green-800 animate-slide-down">
                            <div className="p-1 rounded-full bg-green-200">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-semibold">Файли успішно завантажено!</p>
                                <p className="text-sm text-green-600 mt-1">Ви можете додати ще або натиснути &#34;Відправити на перевірку&#34; внизу</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-800 animate-slide-down">
                            <div className="p-1 rounded-full bg-red-200">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-semibold">Помилка завантаження</p>
                                <p className="text-sm text-red-600 mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`
                            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                            transition-all duration-200 relative overflow-hidden
                            ${isDragging
                            ? "border-blue-400 bg-blue-50 scale-[1.02]"
                            : "border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                        }
                            ${isUploading ? "pointer-events-none opacity-50" : ""}
                        `}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                            disabled={isUploading}
                        />

                        <div className="relative z-10">
                            <div
                                className={`
                                p-4 rounded-full bg-blue-50 inline-block mb-4
                                transition-transform duration-200
                                ${isDragging ? "scale-110 rotate-12" : ""}
                            `}
                            >
                                <FileUp className="h-8 w-8 text-blue-500" />
                            </div>
                            <p className="text-lg font-medium mb-2 text-blue-700">
                                {isDragging ? "Відпустіть файли для завантаження" : "Перетягніть файли сюди"}
                            </p>
                            <p className="text-sm text-blue-500">або натисніть для вибору</p>
                            <p className="text-xs text-blue-400 mt-2">Підтримуються будь-які формати файлів</p>
                        </div>

                        {isDragging && (
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 via-transparent to-blue-100/50 animate-shimmer" />
                        )}
                    </div>

                    {selectedFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <p className="text-sm font-medium flex items-center gap-2 text-blue-700">
                                <FileText className="h-4 w-4" />
                                Вибрано файлів: {selectedFiles.length}
                            </p>
                            <div className="max-h-48 overflow-y-auto space-y-2 p-2">
                                {selectedFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-100 group hover:bg-blue-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <FileText className="h-4 w-4 flex-shrink-0 text-blue-500" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-blue-700 truncate">{file.name}</p>
                                                <p className="text-xs text-blue-500">{formatFileSize(file.size)}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 hover:text-blue-700 hover:bg-blue-200"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleRemoveFile(index)
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isUploading && (
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-sm text-blue-600">
                                <span>Завантаження...</span>
                                <span className="font-medium">{uploadProgress}%</span>
                            </div>
                            <Progress value={uploadProgress} className="h-2 bg-blue-100" />
                        </div>
                    )}

                    <Button
                        onClick={handleUploadClick}
                        disabled={selectedFiles.length === 0 || isUploading}
                        className="w-full mt-4 h-12 text-base relative overflow-hidden group bg-blue-600 hover:bg-blue-700 text-white"
                        size="lg"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            {isUploading ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Завантаження...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-5 w-5 group-hover:translate-y-[-2px] transition-transform" />
                                    Завантажити файли ({selectedFiles.length})
                                </>
                            )}
                        </span>
                    </Button>
                </div>

                {/* ВЕЛИКА КНОПКА ЗАВЕРШЕННЯ (Відправити на перевірку) */}
                {onComplete && (
                    <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-lg flex flex-col items-center text-center mt-4">
                        <h3 className="text-xl font-bold text-blue-900 mb-2">Готові здати роботу?</h3>
                        <p className="text-sm text-blue-500 mb-6 max-w-md">
                            Переконайтеся, що ви завантажили всі необхідні файли. Після відправки замовлення буде передано на перевірку редактору.
                        </p>

                        <Button
                            onClick={handleCompleteClick}
                            disabled={targetFiles.length === 0 || filesLoading || isUploading}
                            className="w-full sm:w-2/3 h-16 text-lg font-bold bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            size="lg"
                        >
                            <CheckCircle2 className="w-6 h-6 mr-3" />
                            Відправити на перевірку
                        </Button>

                        {/* Попередження, якщо немає файлів */}
                        {(targetFiles.length === 0 && !filesLoading) && (
                            <p className="text-red-500 text-sm mt-4 font-medium flex items-center gap-1">
                                <AlertCircle className="w-4 h-4"/>
                                Спочатку завантажте хоча б один файл з перекладом (Target)
                            </p>
                        )}
                    </div>
                )}

            </div>
        </div>
    )
}