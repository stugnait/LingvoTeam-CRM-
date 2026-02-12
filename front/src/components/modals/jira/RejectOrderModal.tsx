"use client"

import {
    Dialog,
    DialogContent,
} from "../../ui/dialog"
import { Button } from "../../ui/button"
import { Textarea } from "../../ui/textarea"
import { X, AlertCircle } from "lucide-react"
import { useState } from "react"

interface RejectOrderModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: (comment?: string) => void
    onCancel: () => void
    isLoading?: boolean
}

export function RejectOrderModal({
                                     open,
                                     onOpenChange,
                                     onConfirm,
                                     onCancel,
                                     isLoading = false
                                 }: RejectOrderModalProps) {
    const [showCommentField, setShowCommentField] = useState(false)
    const [comment, setComment] = useState("")

    const handleYes = () => {
        setShowCommentField(true)
    }

    const handleNo = () => {
        setShowCommentField(false)
        setComment("")
        onCancel()
        onOpenChange(false)
    }

    const handleSubmit = () => {
        onConfirm(comment)
        setShowCommentField(false)
        setComment("")
    }

    const handleClose = () => {
        setShowCommentField(false)
        setComment("")
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Відхилення замовлення
                        </h2>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                    <p className="text-base text-gray-700 mb-6">
                        Чи дійсно ви хочете відхилити замовлення?
                    </p>

                    {!showCommentField ? (
                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="outline"
                                onClick={handleNo}
                                disabled={isLoading}
                                className="min-w-[80px] border-gray-300 hover:bg-gray-50"
                            >
                                Ні
                            </Button>
                            <Button
                                onClick={handleYes}
                                disabled={isLoading}
                                className="min-w-[80px] bg-red-600 hover:bg-red-700 text-white"
                            >
                                Так
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-600 mb-2 block">
                                    Залишіть коментар за бажанням
                                </label>
                                <Textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Введіть ваш коментар..."
                                    className="min-h-[100px] resize-none text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="flex gap-3 justify-end pt-2">
                                <Button
                                    variant="outline"
                                    onClick={handleNo}
                                    disabled={isLoading}
                                    className="min-w-[100px] border-gray-300 hover:bg-gray-50"
                                >
                                    Скасувати
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {isLoading ? "Відправка..." : "Відправити звіт"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}