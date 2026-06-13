"use client"

import { Input } from "@/src/components/ui/input"
import { Upload, FileText, X } from "lucide-react"
import { cn } from "@/src/lib/utils"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

interface FileUploadProps {
    files: File[]
    onFilesChange: (files: File[]) => void
}

export function FileUpload({ files, onFilesChange }: FileUploadProps) {
    const { t } = useI18n()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) {return}

        const newFiles = Array.from(e.target.files)

        // Додаємо нові файли до вже існуючих
        onFilesChange([...files, ...newFiles])

        // Очищаємо input, щоб можна було вибрати ті ж файли повторно
        e.target.value = ""
    }


    const removeFile = (indexToRemove: number) => {
        onFilesChange(files.filter((_, index) => index !== indexToRemove))
    }

    return (
        <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                <Upload className="h-3.5 w-3.5 text-blue-600" />
                <span>{t("common.uploadFiles")}</span>
            </label>

            <div className="relative">
                <div className={cn(
                    "border-2 border-dashed rounded-lg p-4 transition-all",
                    "border-gray-200 dark:border-gray-800",
                    "hover:border-blue-600 hover:bg-blue-50/5 dark:hover:bg-blue-950/5",
                    files.length > 0 && "border-blue-600 bg-blue-50/5 dark:bg-blue-950/5"
                )}>
                    <Input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-center">
                        <Upload className={cn(
                            "h-5 w-5 mx-auto transition-colors",
                            files.length > 0 ? "text-blue-600" : "text-gray-400"
                        )} />
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                            {t("common.clickOrDragFiles")}
                        </p>
                        <p className="text-[10px] text-gray-500">
                            {t("common.fileTypesHint")}
                        </p>
                    </div>
                </div>
            </div>

            {files.length > 0 && (
                <div className="space-y-1.5 mt-2">
                    {files.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                        >
                            <FileText className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                            <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">
                                {file.name}
                            </span>
                            <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                {(file.size / 1024).toFixed(0)} KB
                            </span>
                            <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                            >
                                <X className="h-3 w-3 text-gray-500" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
