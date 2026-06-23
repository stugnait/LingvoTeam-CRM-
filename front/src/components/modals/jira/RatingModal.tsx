"use client"

import {
    Dialog,
    DialogContent,
} from "../../ui/dialog"
import { Button } from "../../ui/button"
import { Textarea } from "../../ui/textarea"
import { X, Star, Upload, File as FileIcon, Trash2, AlertCircle } from "lucide-react"
import { useState, useCallback, useRef } from "react"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

interface RatingModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: (rating: number, comment?: string, files?: File[]) => void
    onCancel: () => void
    isLoading?: boolean
    title?: string
}

export function RatingModal({
                                open,
                                onOpenChange,
                                onConfirm,
                                onCancel,
                                isLoading = false,
                                title
                            }: RatingModalProps) {
    const { t } = useI18n()
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
        if (e.target.files) {
            addFiles(e.target.files)
        }
        e.target.value = ""
    }

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files) {
            addFiles(e.dataTransfer.files)
        }
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
        if (bytes < 1024) {
            return `${bytes} B`
        }
        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`
        }
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    const displayRating = hoveredRating || rating

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="w-[calc(100vw-32px)] sm:max-w-[560px] p-0 gap-0 overflow-hidden max-h-[92svh] sm:max-h-[90vh] flex flex-col rounded-2xl border-0 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
                    <h2 className="text-lg font-semibold text-slate-900">
                        {title || t("rating.defaultTitle")}
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="px-5 sm:px-8 py-6 overflow-y-auto space-y-8">
                    {/* Rating Section */}
                    <div className="flex flex-col items-center">
                        <p className="text-sm font-medium text-slate-600 mb-5 text-center">
                            {t("rating.question")}
                        </p>

                        {/* Stars */}
                        <div className="flex gap-2 sm:gap-4 mb-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    disabled={isLoading}
                                    className="transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50 focus:outline-none"
                                >
                                    <Star
                                        className={`h-10 w-10 sm:h-12 sm:w-12 transition-all duration-300 ${
                                            star <= displayRating
                                                ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                                                : "fill-slate-100 text-slate-200 hover:text-slate-300"
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>

                        {/* Rating Description */}
                        <div className="h-8 flex items-center justify-center">
                            {displayRating > 0 && (
                                <span className={`text-sm font-bold uppercase tracking-wider px-4 py-1.5 rounded-full transition-all ${
                                    displayRating === 1 ? "bg-red-50 text-red-600" :
                                        displayRating === 2 ? "bg-orange-50 text-orange-600" :
                                            displayRating === 3 ? "bg-amber-50 text-amber-600" :
                                                displayRating === 4 ? "bg-blue-50 text-blue-600" :
                                                    "bg-emerald-50 text-emerald-600"
                                }`}>
                                    {t(`rating.${displayRating}`)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Scale */}
                    <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100">
                        <p className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-wider text-center">
                            {t("rating.scale")}
                        </p>
                        <div className="grid grid-cols-5 gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <div
                                    key={star}
                                    className={`flex flex-col items-center py-3 px-1 rounded-lg transition-all ${
                                        displayRating === star
                                            ? "bg-white shadow-sm ring-1 ring-slate-200/50 scale-105"
                                            : "opacity-75"
                                    }`}
                                >
                                    <div className="flex items-center gap-1 mb-1.5">
                                        <Star className={`h-3.5 w-3.5 ${
                                            star <= displayRating
                                                ? "fill-amber-400 text-amber-400"
                                                : "fill-slate-200 text-slate-300"
                                        }`} />
                                        <span className="text-xs font-semibold text-slate-700">{star}</span>
                                    </div>
                                    <span className={`text-[10px] text-center font-medium leading-tight ${
                                        star === 1 ? "text-red-500" :
                                            star === 2 ? "text-orange-500" :
                                                star === 3 ? "text-amber-500" :
                                                    star === 4 ? "text-blue-500" :
                                                        "text-emerald-500"
                                    }`}>
                                        {t(`rating.${star}`)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* File Upload Section */}
                    <div>
                        <label className="flex items-center justify-between text-sm font-semibold text-slate-700 mb-3">
                            <span>{t("rating.uploadFiles")}</span>
                            <span className="text-xs font-normal text-slate-400">
                                {t("rating.optionalTargetReplace")}
                            </span>
                        </label>

                        {/* Drop zone */}
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => !isLoading && fileInputRef.current?.click()}
                            className={`
                                relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
                                flex flex-col items-center justify-center gap-2
                                ${isDragging
                                ? "border-blue-400 bg-blue-50/50"
                                : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
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
                            <div className={`p-3 rounded-full mb-1 transition-colors ${isDragging ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                                <Upload className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-700">
                                    {isDragging
                                        ? t("rating.dropFilesHere")
                                        : t("rating.dragOrClickFiles")
                                    }
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    {t("rating.anyFileTypes")}
                                </p>
                            </div>
                        </div>

                        {/* File list */}
                        {files.length > 0 && (
                            <div className="mt-4 space-y-2.5">
                                {files.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm"
                                    >
                                        <div className="bg-blue-50 p-2 rounded-lg">
                                            <FileIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                                            <p className="text-xs text-slate-400">{formatSize(file.size)}</p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                removeFile(index)
                                            }}
                                            disabled={isLoading}
                                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                                <div className="flex items-start gap-2 bg-amber-50/80 border border-amber-200/60 rounded-xl px-4 py-3 mt-3">
                                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs font-medium text-amber-800 leading-relaxed">
                                        {t("rating.replaceWarning")}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Comment Section */}
                    <div>
                        <label className="flex items-center justify-between text-sm font-semibold text-slate-700 mb-3">
                            <span>{t("rating.commentLabel")}</span>
                            <span className="text-xs font-normal text-slate-400">{t("rating.optional")}</span>
                        </label>
                        <Textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={t("rating.commentPlaceholder")}
                            className="min-h-[100px] resize-none text-sm rounded-xl border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500 placeholder:text-slate-400 shadow-sm"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="p-4 sm:px-6 sm:py-4 border-t border-slate-100 bg-slate-50 flex flex-col-reverse sm:flex-row gap-3 justify-end">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="w-full sm:w-auto sm:min-w-[100px] bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-lg"
                    >
                        {t("common.cancel")}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || rating === 0}
                        className="w-full sm:w-auto sm:min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                    >
                        {isLoading
                            ? t("reject.sending")
                            : files.length > 0
                                ? t("rating.submitWithFiles", { count: files.length })
                                : t("rating.submitRating")
                        }
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}