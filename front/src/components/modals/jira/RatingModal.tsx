"use client"

import {
    Dialog,
    DialogContent,
} from "../../ui/dialog"
import { Button } from "../../ui/button"
import { Textarea } from "../../ui/textarea"
import { X, Star, Upload, File, Trash2 } from "lucide-react"
import { useState, useCallback, useRef } from "react"

interface RatingModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: (rating: number, comment?: string, files?: File[]) => void
    onCancel: () => void
    isLoading?: boolean
    title?: string
}

const ratingDescriptions: Record<number, string> = {
    1: "Погано",
    2: "Незадовільно",
    3: "Задовільно",
    4: "Добре",
    5: "Чудово"
}

export function RatingModal({
                                open,
                                onOpenChange,
                                onConfirm,
                                onCancel,
                                isLoading = false,
                                title = "Оцініть замовлення"
                            }: RatingModalProps) {
    const [rating, setRating] = useState(0)
    const [hoveredRating, setHoveredRating] = useState(0)
    const [comment, setComment] = useState("")
    const [files, setFiles] = useState<File[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleSubmit = () => {
        if (rating > 0) {
            onConfirm(rating, comment, files.length > 0 ? files : undefined)
            handleReset()
        }
    }

    const handleClose = () => {
        handleReset()
        onOpenChange(false)
    }

    const handleReset = () => {
        setRating(0)
        setHoveredRating(0)
        setComment("")
        setFiles([])
    }

    const handleCancel = () => {
        handleReset()
        onCancel()
    }

    const addFiles = useCallback((newFiles: FileList | File[]) => {
        const arr = Array.from(newFiles)
        setFiles(prev => {
            const existing = new Set(prev.map(f => f.name + f.size))
            const filtered = arr.filter(f => !existing.has(f.name + f.size))
            return [...prev, ...filtered]
        })
    }, [])

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) addFiles(e.target.files)
        e.target.value = ""
    }

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files) addFiles(e.dataTransfer.files)
    }, [addFiles])

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => setIsDragging(false)

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    const displayRating = hoveredRating || rating

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="w-[calc(100vw-32px)] sm:max-w-[560px] p-0 gap-0 overflow-hidden max-h-[92svh] sm:max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 sticky top-0 z-10">
                    <h2 className="text-base sm:text-xl font-semibold text-gray-900">
                        {title}
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-white/50"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="px-4 sm:px-8 py-4 sm:py-6">
                    {/* Rating Section */}
                    <div className="flex flex-col items-center mb-4 sm:mb-6">
                        <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-5 text-center">
                            Як би ви оцінили виконання цього замовлення?
                        </p>

                        {/* Stars */}
                        <div className="flex gap-2 sm:gap-3 mb-3 sm:mb-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    disabled={isLoading}
                                    className="transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"
                                >
                                    <Star
                                        className={`h-9 w-9 sm:h-12 sm:w-12 transition-colors ${
                                            star <= displayRating
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "fill-none text-gray-300"
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>

                        {/* Rating Description */}
                        <div className="h-7 flex items-center">
                            {displayRating > 0 && (
                                <p className={`text-lg font-semibold transition-all ${
                                    displayRating === 1 ? "text-red-600" :
                                        displayRating === 2 ? "text-orange-600" :
                                            displayRating === 3 ? "text-yellow-600" :
                                                displayRating === 4 ? "text-blue-600" :
                                                    "text-green-600"
                                }`}>
                                    {ratingDescriptions[displayRating]}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Scale */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-5 border border-gray-200">
                        <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                            Шкала оцінювання:
                        </p>
                        <div className="grid grid-cols-5 gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <div
                                    key={star}
                                    className={`flex flex-col items-center p-2 rounded transition-colors ${
                                        displayRating === star ? "bg-white shadow-sm" : ""
                                    }`}
                                >
                                    <div className="flex items-center gap-0.5 mb-1">
                                        <Star className={`h-3 w-3 ${
                                            star <= displayRating
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "fill-gray-300 text-gray-300"
                                        }`} />
                                        <span className="text-xs font-medium text-gray-700">{star}</span>
                                    </div>
                                    <span className={`text-[10px] text-center ${
                                        star === 1 ? "text-red-600" :
                                            star === 2 ? "text-orange-600" :
                                                star === 3 ? "text-yellow-600" :
                                                    star === 4 ? "text-blue-600" :
                                                        "text-green-600"
                                    }`}>
                                        {ratingDescriptions[star]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* File Upload Section */}
                    <div className="mb-5">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Завантажити файли{" "}
                            <span className="text-gray-400 font-normal">
                                (необов'язково — замінить файли в папці target)
                            </span>
                        </label>

                        {/* Drop zone */}
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => !isLoading && fileInputRef.current?.click()}
                            className={`
                                relative border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all
                                ${isDragging
                                ? "border-blue-400 bg-blue-50"
                                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                            }
                                ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
                            `}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFileInput}
                                disabled={isLoading}
                            />
                            <Upload className={`h-8 w-8 mx-auto mb-2 ${isDragging ? "text-blue-500" : "text-gray-400"}`} />
                            <p className="text-sm text-gray-600">
                                {isDragging
                                    ? "Відпустіть файли тут"
                                    : "Перетягніть файли або натисніть для вибору"
                                }
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Будь-які формати файлів
                            </p>
                        </div>

                        {/* File list */}
                        {files.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {files.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                                    >
                                        <File className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-800 truncate">{file.name}</p>
                                            <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                removeFile(index)
                                            }}
                                            disabled={isLoading}
                                            className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-1.5">
                                    ⚠️ Ці файли замінять усі поточні файли в папці target
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Comment Section */}
                    <div className="mb-6">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Залишіть коментар{" "}
                            <span className="text-gray-400 font-normal">(необов'язково)</span>
                        </label>
                        <Textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Поділіться своїми враженнями..."
                            className="min-h-[90px] resize-none text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end">
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isLoading}
                            className="w-full sm:w-auto sm:min-w-[100px] border-gray-300 hover:bg-gray-50"
                        >
                            Скасувати
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading || rating === 0}
                            className="w-full sm:w-auto sm:min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading
                                ? "Відправка..."
                                : files.length > 0
                                    ? `Відправити (${files.length} файл${files.length === 1 ? "" : "и"})`
                                    : "Відправити оцінку"
                            }
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}