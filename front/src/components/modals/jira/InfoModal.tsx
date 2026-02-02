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
    Link2,
    Share2,
    MoreHorizontal,
    X,
    Plus,
    Paperclip,
    Settings
} from "lucide-react"

interface TaskModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    taskId: string
    taskTitle: string
    taskDescription: string
    status: string
    priority: "low" | "medium" | "high" | "critical"
    assignee?: {
        name: string
        avatar?: string
        role: string
    }
    reporter?: {
        name: string
        avatar?: string
    }
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
}

export function TaskModal({
                              open,
                              onOpenChange,
                              taskId,
                              taskTitle,
                              taskDescription,
                              status,
                              priority,
                              assignee,
                              reporter,
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
                        <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-100">
                            <Link2 className="h-4 w-4 mr-2" />
                            Добавить еріс
                        </Button>
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
                                <h3 className="text-sm font-semibold text-gray-700">Описание</h3>
                                <Button variant="ghost" size="sm" className="h-7 text-xs">
                                    Редактировать описание
                                </Button>
                            </div>
                            <div className="text-sm text-gray-600 whitespace-pre-line bg-gray-50 p-3 rounded">
                                {taskDescription || "Редактировать описание"}
                            </div>
                        </div>

                        {/* Subtasks Section */}
                        <div className="mb-8">
                            <button className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3 hover:text-gray-900">
                                <ChevronDown className="h-4 w-4" />
                                Подзадачи
                                <span className="text-xs text-gray-500 font-normal">Выполнено 50 %</span>
                            </button>

                            <div className="mb-2">
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500" style={{ width: '50%' }} />
                                </div>
                            </div>

                            {/* Example subtasks */}
                            <div className="space-y-2 mb-3">
                                <div className="flex items-center gap-2 text-sm p-2 hover:bg-gray-50 rounded">
                                    <span className="text-gray-400">☐</span>
                                    <span className="text-blue-600">LIN-60</span>
                                    <span className="text-gray-700">Завантаження і перегляд таски</span>
                                    <span className="ml-auto">{getPriorityIcon()}</span>
                                    <span className="text-xs">M</span>
                                    <Avatar className="h-5 w-5">
                                        <AvatarFallback className="text-xs">A</AvatarFallback>
                                    </Avatar>
                                    <Badge variant="secondary" className="text-xs">ГОТОВО</Badge>
                                </div>
                            </div>

                            <Button variant="ghost" size="sm" className="text-xs text-gray-600 h-8">
                                + Добавить связанную задачу
                            </Button>
                        </div>

                        {/* Linked Tasks */}
                        <div className="mb-8">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Привязанные задачи</h3>
                            <Button variant="ghost" size="sm" className="text-xs text-gray-600 h-8">
                                Добавить связанную задачу
                            </Button>
                        </div>

                        {/* Comments Section */}
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-4">Комментарии</h3>

                            <div className="flex gap-3">
                                <Avatar className="h-8 w-8 mt-1">
                                    <AvatarFallback>{reporter?.name?.charAt(0) || "U"}</AvatarFallback>
                                    <AvatarImage src={reporter?.avatar} />
                                </Avatar>
                                <div className="flex-1">
                                    <Textarea
                                        placeholder="Добавить комментарий..."
                                        className="min-h-[80px] resize-none text-sm border-gray-300 focus:border-blue-500"
                                    />
                                    <div className="flex items-center gap-2 mt-2">
                                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs">
                                            Сохранить
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Paperclip className="h-4 w-4" />
                                        </Button>
                                        <div className="flex gap-1 ml-2">
                                            <button className="text-lg hover:bg-gray-100 rounded px-1">👍</button>
                                            <button className="text-lg hover:bg-gray-100 rounded px-1">😊</button>
                                            <button className="text-lg hover:bg-gray-100 rounded px-1">👎</button>
                                            <button className="text-lg hover:bg-gray-100 rounded px-1">🚫</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="w-80 border-l bg-gray-50 overflow-y-auto p-4">
                        {/* Status Dropdown */}
                        <div className="mb-6">
                            <Button
                                className="w-full justify-between bg-blue-600 hover:bg-blue-700 text-white"
                                variant="default"
                            >
                                {status}
                                <ChevronDown className="h-4 w-4 ml-2" />
                            </Button>
                        </div>

                        {/* Details Section */}
                        <div className="space-y-1">
                            <button className="flex items-center justify-between w-full py-2 hover:bg-gray-100 rounded px-2">
                                <span className="text-sm font-semibold text-gray-700">Сведения</span>
                                <Settings className="h-4 w-4 text-gray-400" />
                            </button>

                            {/* Assignee */}
                            <div className="py-3 px-2">
                                <label className="text-xs text-gray-600 mb-2 block">Исполнитель</label>
                                {assignee ? (
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={assignee.avatar} />
                                            <AvatarFallback className="text-xs">{assignee.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium">{assignee.name}</span>
                                    </div>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={onAssignToMe}
                                        disabled={isLoading}
                                        className="h-8 w-full justify-start text-gray-600 hover:bg-gray-100"
                                    >
                                        Нет
                                    </Button>
                                )}
                            </div>

                            {/* Labels */}
                            <div className="py-3 px-2">
                                <label className="text-xs text-gray-600 mb-2 block">Метки</label>
                                {labels && labels.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                        {labels.map((label, index) => (
                                            <Badge key={index} variant="outline" className="bg-gray-200 text-xs">
                                                {label}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-600">Нет</div>
                                )}
                            </div>

                            {/* Reporter */}
                            <div className="py-3 px-2">
                                <label className="text-xs text-gray-600 mb-2 block">Родитель</label>
                                <div className="text-sm text-gray-600">Нет</div>
                            </div>

                            {/* Due Date */}
                            <div className="py-3 px-2">
                                <label className="text-xs text-gray-600 mb-2 block">Срок исполнения</label>
                                <div className="text-sm text-gray-600">{dueDate || "Нет"}</div>
                            </div>

                            {/* Team */}
                            {team && (
                                <div className="py-3 px-2">
                                    <label className="text-xs text-gray-600 mb-2 block">Team</label>
                                    <div className="text-sm text-gray-600">{team}</div>
                                </div>
                            )}

                            {/* Start Date */}
                            {startDate && (
                                <div className="py-3 px-2">
                                    <label className="text-xs text-gray-600 mb-2 block">Start date</label>
                                    <div className="text-sm text-gray-600">{startDate}</div>
                                </div>
                            )}

                            {/* Sprint */}
                            <div className="py-3 px-2">
                                <label className="text-xs text-gray-600 mb-2 block">Sprint</label>
                                <div className="text-sm text-blue-600 hover:underline cursor-pointer">
                                    {sprint || "Нет"}
                                </div>
                            </div>

                            {/* Reporter/Author */}
                            <div className="py-3 px-2">
                                <label className="text-xs text-gray-600 mb-2 block">Автор</label>
                                {reporter && (
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={reporter.avatar} />
                                            <AvatarFallback className="text-xs">{reporter.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium">{reporter.name}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Development Section */}
                        <div className="mt-6">
                            <button className="flex items-center gap-2 w-full py-2 hover:bg-gray-100 rounded px-2">
                                <ChevronDown className="h-4 w-4" />
                                <span className="text-sm font-semibold text-gray-700">Разработка</span>
                            </button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}