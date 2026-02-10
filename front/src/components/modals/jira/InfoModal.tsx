"use client"

import {
    Dialog,
    DialogContent,
} from "../../ui/dialog"
import { Button } from "../../ui/button"
import { Badge } from "../../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"
import { Textarea } from "../../ui/textarea"
import {
    ChevronDown,
    Share2,
    MoreHorizontal,
    X,
    Paperclip,
    Settings,
    Download,
    FileText
} from "lucide-react"

interface TaskModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    taskId: string
    taskTitle: string
    taskDescription: string
    status: string
    priority: string,
    manager: string
    translator: string,
    dueDate?: string
    labels?: string[]
    sprint?: string
    team?: string
    startDate?: string
    isLoading?: boolean
    onSave: () => void
    onCancel: () => void
    onDelete?: () => void
    onAssignToMe?: () => void
    onDownloadOriginal?: () => void
    onDownloadTranslation?: () => void
}

export function TaskModal({
                              open,
                              onOpenChange,
                              taskId,
                              taskTitle,
                              taskDescription,
                              status,
                              priority,
                              manager,
                              translator,
                              dueDate,
                              labels,
                              sprint,
                              team,
                              startDate,
                              isLoading,
                              onSave,
                              onCancel,
                              onDelete,
                              onAssignToMe,
                              onDownloadOriginal,
                              onDownloadTranslation,
                          }: TaskModalProps) {
    const getPriorityIcon = () => {
        const icons = {
            critical: "⚠️",
            high: "🔴",
            medium: "🟡",
            low: "🟢"
        }
        return icons[priority] || "="
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-6xl max-h-[95vh] p-0 gap-0 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-3 border-b bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">✓</span>
                            <span className="text-sm font-medium text-blue-600">{taskId}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <span className="text-lg">👁️</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Share2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onOpenChange(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex overflow-hidden h-[calc(95vh-57px)]">
                    {/* Main Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
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
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-gray-700">Файли</h3>

                                {/* Кнопки завантаження */}
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onDownloadOriginal}
                                        className="h-8 text-xs gap-1.5 border-gray-300 hover:bg-gray-50"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        Завантажити оригінал
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onDownloadTranslation}
                                        className="h-8 text-xs gap-1.5 border-blue-300 text-blue-600 hover:bg-blue-50"
                                    >
                                        <FileText className="h-3.5 w-3.5" />
                                        Завантажити переклад
                                    </Button>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Sidebar */}
                    <div className="w-80 border-l bg-gray-50 overflow-y-auto p-4">
                        {/* Status Dropdown */}
                        <div className="mb-6">
                            <Button
                                className="w-full justify-between bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                variant="default"
                            >
                                <span className="font-medium">{status}</span>
                                <ChevronDown className="h-4 w-4 ml-2" />
                            </Button>
                        </div>

                        {/* Details Section */}
                        <div className="space-y-1 bg-white rounded-lg border border-gray-200 p-1">
                            <button className="flex items-center justify-between w-full py-2.5 px-3 hover:bg-gray-50 rounded">
                                <span className="text-sm font-semibold text-gray-700">Деталі</span>
                                <Settings className="h-4 w-4 text-gray-400" />
                            </button>

                            {/* Assignee */}
                            <div className="py-3 px-3 border-t">
                                <label className="text-xs text-gray-600 mb-2 block">Виконавець</label>
                                {translator ? (
                                    <div className="flex items-center gap-2">
                                        {/*<Avatar className="h-7 w-7">*/}
                                        {/*    /!*<AvatarImage src={assignee.avatar} />*!/*/}
                                        {/*    <AvatarFallback className="text-xs bg-blue-100">{manager}</AvatarFallback>*/}
                                        {/*</Avatar>*/}
                                        <div>
                                            <span className="text-sm font-medium">{translator}</span>
                                            {/*<div className="text-xs text-gray-500">{assignee.role}</div>*/}
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={onAssignToMe}
                                        disabled={isLoading}
                                        className="h-8 w-full justify-start text-gray-600 hover:bg-gray-50 border border-dashed border-gray-300"
                                    >
                                        <span className="text-gray-400">+</span>
                                        Призначити
                                    </Button>
                                )}
                            </div>

                            {/* Labels */}
                            <div className="py-3 px-3 border-t">
                                <label className="text-xs text-gray-600 mb-2 block">Мітки</label>
                                {labels && labels.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {labels.map((label, index) => (
                                            <Badge
                                                key={index}
                                                variant="outline"
                                                className="bg-gray-100 text-xs hover:bg-gray-200 border-gray-300"
                                            >
                                                {label}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-600">Немає</div>
                                )}
                            </div>

                            {/* Priority */}
                            <div className="py-3 px-3 border-t">
                                <label className="text-xs text-gray-600 mb-2 block">Пріоритет</label>
                                <div className="flex items-center gap-2">
                                    <span>{getPriorityIcon()}</span>
                                    <span className="text-sm font-medium capitalize">{priority}</span>
                                </div>
                            </div>

                            {/* Due Date */}
                            <div className="py-3 px-3 border-t">
                                <label className="text-xs text-gray-600 mb-2 block">Термін виконання</label>
                                <div className={`text-sm ${dueDate ? "font-medium" : "text-gray-600"}`}>
                                    {dueDate || "Немає"}
                                </div>
                            </div>

                            {/* Team */}
                            {team && (
                                <div className="py-3 px-3 border-t">
                                    <label className="text-xs text-gray-600 mb-2 block">Команда</label>
                                    <div className="text-sm text-gray-700 font-medium">{team}</div>
                                </div>
                            )}

                            {/* Reporter/Author */}
                            <div className="py-3 px-3 border-t">
                                <label className="text-xs text-gray-600 mb-2 block">Менеджер</label>
                                {manager && (
                                    <div className="flex items-center gap-2">
                                        {/*<Avatar className="h-7 w-7">*/}
                                        {/*    <AvatarImage src={reporter.avatar} />*/}
                                        {/*    <AvatarFallback className="text-xs bg-green-100">{manager}</AvatarFallback>*/}
                                        {/*</Avatar>*/}
                                        <span className="text-sm font-medium">{manager}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Development Section */}
                        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-1">
                            <button className="flex items-center gap-2 w-full py-2.5 px-3 hover:bg-gray-50 rounded">
                                <ChevronDown className="h-4 w-4" />
                                <span className="text-sm font-semibold text-gray-700">Розробка</span>
                            </button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}