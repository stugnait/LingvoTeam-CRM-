"use client"

import type { ExternalOrder, ExternalOrderFileItem } from "../types"
import {
    Calendar,
    MessageSquare,
    Languages,
    FileText,
    Download,
    AlertCircle,
    Eye,
} from "lucide-react"

import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"

interface Props {
    order: ExternalOrder
    error?: string | null
    onDownload: () => void
    filesCount?: number | null
    filesLoading?: boolean
    files?: ExternalOrderFileItem[]
    onRefreshFiles?: () => void
    onDownloadFile?: (fileId: number, filename: string) => void
    downloadLoading?: boolean
}

export function MainClient({
    order,
    error,
    onDownload,
    filesCount,
    filesLoading,
    files = [],
    onRefreshFiles,
    onDownloadFile,
    downloadLoading,
}: Props) {
    const isEmpty = filesCount === 0
    return (
        <div className="max-w-4xl mx-auto mt-4 sm:mt-8 p-4 sm:p-6 animate-fade-in">
            {/* Хедер */}
            <div className="mb-6 sm:mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                            Замовлення #{order.id}
                        </h1>
                        <Badge variant="outline" className="text-sm border-blue-200 bg-blue-50 text-blue-700">
                            Клієнтський доступ
                        </Badge>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-red-800 animate-slide-down">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            <div className="grid gap-4 sm:gap-6">
                {/* Основна інформація */}
                <div className="rounded-xl border border-blue-100 bg-white p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-800">
                        <div className="p-2 rounded-lg bg-blue-50">
                            <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <span>Основна інформація</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
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
                            <p className="font-medium text-base bg-blue-50 p-3 rounded-lg border border-blue-100 text-blue-800">
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
                </div>


                {/* Завантаження файлів */}
                <div className="rounded-xl border border-blue-100 bg-white p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-blue-800">
                            <div className="p-2 rounded-lg bg-blue-50 shrink-0">
                                <Eye className="h-5 w-5 text-blue-600" />
                            </div>
                            <span>Файли (final)</span>
                        </h2>

                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                                {filesLoading ? "..." : (filesCount ?? files.length)}
                            </Badge>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRefreshFiles}
                                disabled={filesLoading || downloadLoading || !onRefreshFiles}
                                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                            >
                                Оновити
                            </Button>
                        </div>
                    </div>

                    {filesLoading ? (
                        <p className="text-sm text-blue-500 mb-3">Перевіряємо файли…</p>
                    ) : isEmpty ? (
                        <p className="text-sm text-blue-500 mb-3">Поки що файлів у final немає.</p>
                    ) : null}

                    {!filesLoading && files.length > 0 && (
                        <div className="space-y-2 mb-4">
                            {files.map(f => (
                                <div
                                    key={f.id}
                                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white border border-blue-100"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-blue-900 truncate">{f.name}</p>
                                        <p className="text-xs text-blue-400">ID: {f.id}</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-blue-200 text-blue-700 hover:bg-blue-50 shrink-0"
                                        onClick={() => onDownloadFile?.(f.id, f.name)}
                                        disabled={downloadLoading || !onDownloadFile}
                                    >
                                        Скачати
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    <Button
                        size="lg"
                        onClick={onDownload}
                        disabled={filesLoading || downloadLoading || isEmpty}
                        className="w-full h-12 text-base relative overflow-hidden group bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            <Download className="h-5 w-5 group-hover:translate-y-[-2px] transition-transform" />
                            Скачати все (final)
                        </span>
                    </Button>
                </div>

                {/* Статус */}
                <div className="rounded-xl border border-blue-100 bg-white p-4 sm:p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-800">
                        <div className="p-2 rounded-lg bg-blue-50">
                            <div className="relative">
                                <div className={`h-5 w-5 rounded-full ${
                                    order.status === "completed"
                                        ? "bg-green-500"
                                        : order.status === "in_progress"
                                            ? "bg-blue-500"
                                            : "bg-amber-500"
                                }`} />
                            </div>
                        </div>
                        <span>Статус замовлення</span>
                    </h2>

                    <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-br from-blue-50 to-white border border-blue-100">
                        <div className="relative">
                            <div className={`h-4 w-4 rounded-full ${
                                order.status === "completed"
                                    ? "bg-green-500"
                                    : order.status === "in_progress"
                                        ? "bg-blue-500"
                                        : "bg-amber-500"
                            } animate-pulse`} />
                            <div className={`absolute inset-0 h-4 w-4 rounded-full ${
                                order.status === "completed"
                                    ? "bg-green-500"
                                    : order.status === "in_progress"
                                        ? "bg-blue-500"
                                        : "bg-amber-500"
                            } animate-ping opacity-75`} />
                        </div>
                        <span className="font-medium text-lg text-blue-800">
                            {order.status === "completed"
                                ? "Завершено"
                                : order.status === "in_progress"
                                    ? "В роботі"
                                    : "Очікує"}
                        </span>
                    </div>
                </div>

                {/* Інструкція */}
                <div className="rounded-xl border border-blue-100 bg-white p-4 sm:p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-800">
                        <div className="p-2 rounded-lg bg-blue-50">
                            <Eye className="h-5 w-5 text-blue-600" />
                        </div>
                        <span>Як отримати переклад</span>
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        {[
                            { step: 1, title: "Завантажте файли", description: "Натисніть кнопку для завантаження вихідних файлів" },
                            { step: 2, title: "Виконайте переклад", description: "Перекладіть файли згідно з вимогами" },
                            { step: 3, title: "Очікуйте", description: "Менеджер зв'яжеться з вами щодо готового перекладу" },
                        ].map((item) => (
                            <div key={item.step} className="text-center p-4 rounded-lg bg-blue-50">
                                <div className="w-8 h-8 rounded-full bg-blue-200 text-blue-700 font-bold flex items-center justify-center mx-auto mb-3">
                                    {item.step}
                                </div>
                                <p className="font-medium text-sm mb-1 text-blue-700">{item.title}</p>
                                <p className="text-xs text-blue-500">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
