"use client"

import {
    Dialog,
    DialogContent,
} from "../../ui/dialog"
import { Button } from "../../ui/button"
import { Textarea } from "../../ui/textarea"
import { X, Star } from "lucide-react"
import { useState } from "react"

interface RatingModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: (rating: number, comment?: string) => void
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

    const handleSubmit = () => {
        if (rating > 0) {
            onConfirm(rating, comment)
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
    }

    const handleCancel = () => {
        handleReset()
        onCancel()
    }

    const displayRating = hoveredRating || rating

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h2 className="text-xl font-semibold text-gray-900">
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
                <div className="px-8 py-8">
                    {/* Rating Section */}
                    <div className="flex flex-col items-center mb-8">
                        <p className="text-base text-gray-700 mb-6 text-center">
                            Як би ви оцінили виконання цього замовлення?
                        </p>

                        {/* Stars */}
                        <div className="flex gap-3 mb-4">
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
                                        className={`h-12 w-12 transition-colors ${
                                            star <= displayRating
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "fill-none text-gray-300"
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>

                        {/* Rating Description */}
                        <div className="h-8 flex items-center">
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

                    {/* All Rating Descriptions */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
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

                    {/* Comment Section */}
                    <div className="mb-6">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Залишіть коментар <span className="text-gray-400 font-normal">(необов'язково)</span>
                        </label>
                        <Textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Поділіться своїми враженнями..."
                            className="min-h-[100px] resize-none text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-end">
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isLoading}
                            className="min-w-[100px] border-gray-300 hover:bg-gray-50"
                        >
                            Скасувати
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading || rating === 0}
                            className="min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Відправка..." : "Відправити оцінку"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}