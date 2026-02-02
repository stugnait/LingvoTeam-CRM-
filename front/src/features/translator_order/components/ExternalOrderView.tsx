import type { ExternalOrder } from "../types"
import { Calendar, MessageSquare, Languages, FileText, Upload, X, CheckCircle2 } from "lucide-react"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Progress } from "@/src/components/ui/progress"
import { useState, useRef } from "react"

interface Props {
    order: ExternalOrder
    onUpload: (files: File[]) => Promise<boolean>
    isUploading: boolean
    uploadProgress: number
}

export function ExternalOrderView({ order, onUpload, isUploading, uploadProgress }: Props) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [uploadSuccess, setUploadSuccess] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        setSelectedFiles(prev => [...prev, ...files])
    }

    const handleRemoveFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return

        const success = await onUpload(selectedFiles)
        if (success) {
            setSelectedFiles([])
            setUploadSuccess(true)
            setTimeout(() => setUploadSuccess(false), 3000)
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    return (
        <div className="max-w-4xl mx-auto mt-8 p-6 animate-fade-in">
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Замовлення #{order.id}
                    </h1>
                    <Badge variant="outline" className="text-sm">
                        Зовнішній доступ
                    </Badge>
                </div>
                <p className="text-muted-foreground">
                    Деталі вашого перекладацького замовлення
                </p>
            </div>

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
                            <p className="font-medium text-lg">{order.language_pair}</p>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>Дедлайн</span>
                            </div>
                            <p className="font-medium text-lg">
                                {new Date(order.deadline).toLocaleString('uk-UA', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {(() => {
                                    const deadline = new Date(order.deadline)
                                    const now = new Date()
                                    const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                                    return diffDays > 0 ? `Залишилось ${diffDays} днів` : 'Термін вийшов'
                                })()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Коментар */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Коментар та деталі
                    </h2>
                    <div className="space-y-1.5">
                        <div className="text-sm text-muted-foreground">
                            Додаткова інформація
                        </div>
                        <div className="min-h-[120px] p-4 rounded-lg bg-muted/50 border">
                            {order.comment ? (
                                <p className="whitespace-pre-line text-foreground leading-relaxed">
                                    {order.comment}
                                </p>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                    <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                                    <p>Коментар відсутній</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Форма завантаження файлів */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Завантаження перекладу
                    </h2>

                    {uploadSuccess && (
                        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2 text-green-800">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="text-sm font-medium">Файли успішно завантажено!</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Зона завантаження */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
                        >
                            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                            <p className="text-sm font-medium mb-1">
                                Натисніть для вибору файлів
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Підтримуються всі типи файлів
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                                disabled={isUploading}
                            />
                        </div>

                        {/* Список вибраних файлів */}
                        {selectedFiles.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium">
                                    Вибрано файлів: {selectedFiles.length}
                                </p>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {selectedFiles.map((file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium truncate">
                                                        {file.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatFileSize(file.size)}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveFile(index)}
                                                disabled={isUploading}
                                                className="flex-shrink-0"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Прогрес завантаження */}
                        {isUploading && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Завантаження...</span>
                                    <span className="font-medium">{uploadProgress}%</span>
                                </div>
                                <Progress value={uploadProgress} className="h-2" />
                            </div>
                        )}

                        {/* Кнопка завантаження */}
                        <Button
                            onClick={handleUpload}
                            disabled={selectedFiles.length === 0 || isUploading}
                            className="w-full"
                            size="lg"
                        >
                            {isUploading ? (
                                <>
                                    <Upload className="h-4 w-4 mr-2 animate-pulse" />
                                    Завантаження...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Завантажити файли ({selectedFiles.length})
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Статус та додаткова інформація */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4">Статус</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className={`h-3 w-3 rounded-full ${order.status === 'completed' ? 'bg-green-500' : order.status === 'in_progress' ? 'bg-blue-500' : 'bg-amber-500'}`} />
                            <span className="capitalize font-medium">
                {order.status === 'completed' ? 'Завершено' :
                    order.status === 'in_progress' ? 'В роботі' :
                        'Очікує'}
            </span>
                        </div>
                        {order.file_url && (
                            <a
                            href={order.file_url}
                            className="text-primary hover:text-primary/80 text-sm underline underline-offset-4"
                            target="_blank"
                            rel="noopener noreferrer">
                            Завантажити файл
                            </a>
                            )}
                    </div>
                </div>
            </div>
        </div>
    )
}