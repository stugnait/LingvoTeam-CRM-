"use client"

import {
    Dialog,
    DialogContent,
} from "../../ui/dialog"
import {Button} from "../../ui/button"
import {Badge} from "../../ui/badge"
import {Avatar, AvatarFallback, AvatarImage} from "../../ui/avatar"
import {Textarea} from "../../ui/textarea"
import {
    ChevronDown,
    Share2,
    MoreHorizontal,
    X,
    Paperclip,
    Settings,
    Download,
    FileText,
    Calendar,
    Eye
} from "lucide-react"

interface TaskModalProps {
    open: boolean,
    onOpenChange: (open: boolean) => void,
    taskId: string,
    taskTitle: string,
    taskDescription: string,
    status: string,
    priority: "critical" | "high" | "medium" | "low" | string,
    priorityName?: string,
    translator: string,
    editor: string,
    dueDate: string,
    labels?: string[],
    sprint?: string,
    team?: string,
    startDate?: string,
    isLoading?: boolean,
    clientName?: string,
    languagePair?: string,
    onSave: () => void,
    onCancel: () => void,
    onDelete?: () => void,
    onAssignToMe?: () => void,
    onDownloadOriginal?: () => void,
    onDownloadTranslation?: () => void,
    avatar_url?: string | null,
    intake_manager?: { id: number; name: string; avatar?: string } | null,
    delivery_manager?: { id: number; name: string; avatar?: string } | null,
    orderId?: number,
    sourceFiles?: { id: number; name: string }[]
    targetFiles?: { id: number; name: string }[]
    filesLoading?: boolean
    downloadLoading?: boolean
    onLoadFiles?: (orderId: number) => void
    onDownloadSingleSource?: (orderId: number, fileId: number, filename: string) => void
    onDownloadSingleTarget?: (orderId: number, fileId: number, filename: string) => void
}

export function TaskModal({
                              open,
                              onOpenChange,
                              taskId,
                              taskTitle,
                              taskDescription,
                              status,
                              priority,
                              priorityName,
                              translator,
                              dueDate,
                              labels,
                              sprint,
                              team,
                              startDate,
                              isLoading,
                              clientName,
                              languagePair,
                              onSave,
                              onCancel,
                              onDelete,
                              onAssignToMe,
                              onDownloadOriginal,
                              onDownloadTranslation,
                              intake_manager,
                              delivery_manager,
                              editor,
                              orderId,
                              sourceFiles = [],
                              targetFiles = [],
                              filesLoading,
                              downloadLoading,
                              onLoadFiles,
                              onDownloadSingleSource,
                              onDownloadSingleTarget,
                          }: TaskModalProps) {
    const getPriorityIcon = () => {
        const icons: Record<string, string> = {
            critical: "⚠️", "4": "⚠️",
            high: "🔴", "3": "🔴",
            medium: "🟡", "2": "🟡",
            low: "🟢", "1": "🟢"
        }

        return icons[priority?.toString().toLowerCase()] || "="
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100vw-16px)] sm:max-w-6xl max-h-[95svh] sm:max-h-[95vh] p-0 gap-0 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 border-b bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">✓</span>
                            <span className="text-sm font-medium text-blue-600">Task #{taskId}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <span className="text-lg">👁️</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Share2 className="h-4 w-4"/>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4"/>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onOpenChange(false)}
                        >
                            <X className="h-4 w-4"/>
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row overflow-hidden h-[calc(95svh-49px)] sm:h-[calc(95vh-57px)]">
                    {/* Main Content */}
                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
                        {/* Title */}
                        <h1 className="text-xl font-semibold text-gray-900 mb-6 pr-8">
                            {taskTitle}
                        </h1>

                        {/* Description Section */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-gray-700">Опис</h3>
                            </div>
                            <div className="text-sm text-gray-600 whitespace-pre-line bg-gray-50 p-3 rounded">
                                {taskDescription || "Редагувати опис"}
                            </div>
                        </div>

                        {/* Download Buttons Section */}
                        {/* Files Section */}
                        {/* Files Section */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-gray-500" />
                                    Файли для завантаження
                                </h3>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => orderId && onLoadFiles?.(orderId)}
                                    disabled={filesLoading}
                                    className="h-7 text-xs border-gray-300 hover:bg-gray-50"
                                >
                                    Оновити
                                </Button>
                            </div>

                            {/* Source */}
                            <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="font-semibold text-blue-900">Source</p>
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
                                                    <p className="text-xs text-blue-400">ID: {f.id}</p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                                    onClick={() => orderId && onDownloadSingleSource?.(orderId, f.id, f.name)}
                                                    disabled={downloadLoading}
                                                >
                                                    Скачати
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Target */}
                            <div className="mt-4 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="font-semibold text-blue-900">Target</p>
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
                                                    <p className="text-xs text-blue-400">ID: {f.id}</p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                                    onClick={() => orderId && onDownloadSingleTarget?.(orderId, f.id, f.name)}
                                                    disabled={downloadLoading}
                                                >
                                                    Скачати
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Zip buttons */}
                            <div className="mt-4 flex justify-end gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onDownloadOriginal}
                                    disabled={filesLoading || downloadLoading || sourceFiles.length === 0}
                                    className="text-xs gap-1.5 border-gray-300 hover:bg-gray-50"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    Скачати все (source)
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onDownloadTranslation}
                                    disabled={filesLoading || downloadLoading || targetFiles.length === 0}
                                    className="text-xs gap-1.5 border-blue-300 text-blue-600 hover:bg-blue-50"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    Скачати все (target)
                                </Button>
                            </div>
                        </div>

                    </div>

                    {/* Right Sidebar */}
                    <div className="w-full sm:w-80 border-t sm:border-t-0 sm:border-l bg-gray-50 overflow-y-auto p-3 sm:p-4">
                        {/* Status Dropdown */}
                        <div className="mb-6">
                            <Button
                                className="w-full justify-between bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                variant="default"
                            >
                                <span className="font-medium">{status}</span>
                                <ChevronDown className="h-4 w-4 ml-2"/>
                            </Button>
                        </div>

                        {/* Details Section */}
                        <div className="space-y-1 bg-white rounded-lg border border-gray-200 p-1">
                            <button
                                className="flex items-center justify-between w-full py-2.5 px-3 hover:bg-gray-50 rounded">
                                <span className="text-sm font-semibold text-gray-700">Деталі</span>
                                <Settings className="h-4 w-4 text-gray-400"/>
                            </button>

                            {clientName && (
                                <div className="py-3 px-3 border-t">
                                    <label className="text-xs text-gray-600 mb-2 block">Клієнт</label>
                                    <div className="text-sm font-medium">{clientName}</div>
                                </div>
                            )}

                            {languagePair && (
                                <div className="py-3 px-3 border-t">
                                    <label className="text-xs text-gray-600 mb-2 block">Мовна пара</label>
                                    <div className="text-sm font-medium">{languagePair}</div>
                                </div>
                            )}

                            {/* Assignee */}
                            {/* Перекладач */}
                            <div className="py-3 px-3 border-t">
                                <label className="text-xs text-gray-600 mb-2 block">Перекладач</label>
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 bg-green-100 dark:bg-green-900">
            <span className="text-xs font-semibold text-green-600">
                {translator?.charAt(0)?.toUpperCase() || '?'}
            </span>
                                    </div>
                                    <span className="text-sm font-medium">{translator || 'Не призначено'}</span>
                                </div>
                            </div>

                            {/* Редактор */}
                            <div className="py-3 px-3 border-t">
                                <label className="text-xs text-gray-600 mb-2 block">Редактор</label>
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 bg-orange-100 dark:bg-orange-900">
            <span className="text-xs font-semibold text-orange-600">
                {editor?.charAt(0)?.toUpperCase() || '?'}
            </span>
                                    </div>
                                    <span className="text-sm font-medium">{editor || 'Не призначено'}</span>
                                </div>
                            </div>

                            {/* Priority */}
                            <div className="py-3 px-3 border-t">
                                <label className="text-xs text-gray-600 mb-2 block">Пріоритет</label>
                                <div className="flex items-center gap-2">
                                    <span>{getPriorityIcon()}</span>
                                    <span className="text-sm font-medium capitalize">{priorityName || priority}</span>
                                </div>
                            </div>

                            {/* Due Date */}
                            <div className="py-3 px-3 border-t">
                                <label className="text-xs text-gray-600 mb-2 block">Термін виконання</label>
                                {dueDate ? (
                                    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg w-fit ${
                                        new Date(dueDate) < new Date()
                                            ? 'bg-red-50 dark:bg-red-900/20'
                                            : 'bg-blue-50 dark:bg-blue-900/20'
                                    }`}>
                                        <Calendar className={`h-3.5 w-3.5 flex-shrink-0 ${
                                            new Date(dueDate) < new Date() ? 'text-red-500' : 'text-blue-500'
                                        }`} />
                                        <span className={`text-sm font-medium ${
                                            new Date(dueDate) < new Date()
                                                ? 'text-red-700 dark:text-red-300'
                                                : 'text-blue-700 dark:text-blue-300'
                                        }`}>{dueDate}</span>
                                        {new Date(dueDate) < new Date() && (
                                            <span className="text-xs text-red-500 font-semibold">Прострочено</span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
                                        <Calendar className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                        <span className="text-sm text-gray-400">Не вказано</span>
                                    </div>
                                )}
                            </div>

                            {/* Team */}
                            {team && (
                                <div className="py-3 px-3 border-t">
                                    <label className="text-xs text-gray-600 mb-2 block">Команда</label>
                                    <div className="text-sm text-gray-700 font-medium">{team}</div>
                                </div>
                            )}

                            {/* Reporter/Author */}
                            {/* Менеджер прийому */}
                            <div className="py-3 px-3 border-t">
                                <label className="text-xs text-gray-600 mb-2 block">Менеджер прийому</label>
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 bg-blue-100 dark:bg-blue-900">
                                        {intake_manager?.avatar ? (
                                            <img src={intake_manager.avatar} alt={intake_manager.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-semibold text-blue-600">
                    {intake_manager?.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
                                        )}
                                    </div>
                                    <span className="text-sm font-medium">{intake_manager?.name || 'Не призначено'}</span>
                                </div>
                            </div>

                            {/* Менеджер здачі */}
                            <div className="py-3 px-3 border-t">
                                <label className="text-xs text-gray-600 mb-2 block">Менеджер здачі</label>
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 bg-purple-100 dark:bg-purple-900">
                                        {delivery_manager?.avatar ? (
                                            <img src={delivery_manager.avatar} alt={delivery_manager.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-semibold text-purple-600">
                    {delivery_manager?.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
                                        )}
                                    </div>
                                    <span className="text-sm font-medium">{delivery_manager?.name || 'Не призначено'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}