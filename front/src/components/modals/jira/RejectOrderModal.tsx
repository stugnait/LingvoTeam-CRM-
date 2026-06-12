"use client"

import {
    Dialog,
    DialogContent,
} from "../../ui/dialog"
import { Button } from "../../ui/button"
import { Textarea } from "../../ui/textarea"
import { AlertCircle } from "lucide-react"
import { useState } from "react"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

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
    const { t } = useI18n()
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
            <DialogContent className="w-[calc(100vw-32px)] sm:max-w-[480px] p-0 gap-0 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b bg-white">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                        </div>
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                            {t("reject.title")}
                        </h2>
                    </div>
                </div>

                {/* Content */}
                <div className="px-4 sm:px-6 py-4 sm:py-6">
                    <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6">
                        {t("reject.confirmQuestion")}
                    </p>

                    {!showCommentField ? (
                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="outline"
                                onClick={handleNo}
                                disabled={isLoading}
                                className="flex-1 sm:flex-none min-w-[80px] border-gray-300 hover:bg-gray-50"
                            >
                                {t("reject.no")}
                            </Button>
                            <Button
                                onClick={handleYes}
                                disabled={isLoading}
                                className="flex-1 sm:flex-none min-w-[80px] bg-red-600 hover:bg-red-700 text-white"
                            >
                                {t("reject.yes")}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-600 mb-2 block">
                                    {t("reject.optionalComment")}
                                </label>
                                <Textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder={t("reject.commentPlaceholder")}
                                    className="min-h-[100px] resize-none text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end pt-2">
                                <Button
                                    variant="outline"
                                    onClick={handleNo}
                                    disabled={isLoading}
                                    className="w-full sm:w-auto sm:min-w-[100px] border-gray-300 hover:bg-gray-50"
                                >
                                    {t("common.cancel")}
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="w-full sm:w-auto sm:min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {isLoading ? t("reject.sending") : t("reject.sendReport")}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
