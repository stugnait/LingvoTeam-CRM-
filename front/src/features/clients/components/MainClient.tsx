"use client"

import type { ExternalOrder } from "../types"
import {
    Calendar,
    MessageSquare,
    Languages,
    FileText,
    Download,
    AlertCircle,
} from "lucide-react"

import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"

interface Props {
    order: ExternalOrder
    error?: string | null
    onDownload: () => void
}

export function MainClient({ order, error, onDownload }: Props) {
    return (
        <div className="max-w-4xl mx-auto mt-8 p-6 animate-fade-in">
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Замовлення #{order.id}
                    </h1>
                    <Badge variant="outline" className="text-sm">
                        Клієнтський доступ
                    </Badge>
                </div>
                <p className="text-muted-foreground">
                    Деталі вашого замовлення перекладу
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-red-800">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            <div className="grid gap-6">

                {/* Основна інформація */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Основна інформація
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Languages className="h-4 w-4" />
                                <span>Мовна пара</span>
                            </div>
                            <p className="font-medium text-lg">
                                {order.language_pair}
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>Дедлайн</span>
                            </div>
                            <p className="font-medium text-lg">
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

                {/* Коментар */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Коментар
                    </h2>

                    <div className="min-h-[120px] p-4 rounded-lg bg-muted/50 border">
                        {order.comment ? (
                            <p className="whitespace-pre-line leading-relaxed">
                                {order.comment}
                            </p>
                        ) : (
                            <p className="text-muted-foreground">
                                Коментар відсутній
                            </p>
                        )}
                    </div>
                </div>

                {/* Завантаження файлів */}
                <Button
                    size="lg"
                    className="w-full"
                    onClick={onDownload}
                >
                    <Download className="h-4 w-4 mr-2" />
                    Завантажити файли
                </Button>

                {/* Статус */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4">Статус</h2>

                    <div className="flex items-center gap-2">
                        <div
                            className={`h-3 w-3 rounded-full ${
                                order.status === "completed"
                                    ? "bg-green-500"
                                    : order.status === "in_progress"
                                        ? "bg-blue-500"
                                        : "bg-amber-500"
                            }`}
                        />
                        <span className="capitalize font-medium">
                            {order.status === "completed"
                                ? "Завершено"
                                : order.status === "in_progress"
                                    ? "В роботі"
                                    : "Очікує"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}