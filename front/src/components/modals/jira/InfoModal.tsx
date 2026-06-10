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
    Eye,
    BarChart2,
    Loader2,
    FileUp // 👉 Додано іконку
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

    // Результати аналізу папок
    sourceStats?: any | null
    sourceStatsLoading?: boolean
    targetStats?: any | null
    targetStatsLoading?: boolean
    onAnalyzeFolder?: (orderId: number, folder: "source" | "target") => void

    // 👉 ДОДАНО: Пропси для завантаження в Target менеджером
    onUploadTarget?: (files: File[]) => Promise<boolean>
    isUploadingTarget?: boolean
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

                              sourceStats,
                              sourceStatsLoading,
                              targetStats,
                              targetStatsLoading,
                              onAnalyzeFolder,

                              // Деструктуризація нових параметрів
                              onUploadTarget,
                              isUploadingTarget,
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

    const StatsBlock = ({ stats }: { stats: any }) => {
        if (!stats || !stats.total_stats) return null;
        const s = stats.total_stats;
        return (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-700 animate-in fade-in duration-200">
                <div>Сторінок: <span className="font-bold text-gray-900">{s.physical_pages}</span></div>
                <div>Зображень: <span className="font-bold text-gray-900">{s.images}</span></div>
                <div className="truncate">З пробілами: <span className="font-bold text-gray-900">{s.chars_with_spaces}</span></div>
                <div className="truncate">Без пробілів: <span className="font-bold text-gray-900">{s.chars_no_spaces}</span></div>
            </div>
        );
    };

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
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
                            <X className="h-4 w-4"/>
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row overflow-hidden h-[calc(95svh-49px)] sm:h-[calc(95vh-57px)]">
                    {/* Main Content */}
                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
                        <h1 className="text-xl font-semibold text-gray-900 mb-6 pr-8">{taskTitle}</h1>

                        {/* Description */}
                        <div className="mb-8">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Опис</h3>
                            <div className="text-sm text-gray-600 whitespace-pre-line bg-gray-50 p-3 rounded">
                                {taskDescription || "Редагувати опис"}
                            </div>
                        </div>

                        {/* Files Section */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-gray-500" />
                                    Файли замовлення
                                </h3>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => orderId && onLoadFiles?.(orderId)}
                                    disabled={filesLoading}
                                    className="h-7 text-xs border-gray-300 hover:bg-gray-50"
                                >
                                    Оновити списки файлів
                                </Button>
                            </div>

                            {/* SOURCE BLOCK */}
                            <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/40 to-white p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-blue-900">Source</p>
                                        <Badge variant="outline" className="border-blue-200 bg-white text-blue-700">
                                            {filesLoading ? "..." : sourceFiles.length}
                                        </Badge>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={filesLoading || sourceStatsLoading || sourceFiles.length === 0}
                                        onClick={() => orderId && onAnalyzeFolder?.(orderId, "source")}
                                        className="h-7 text-xs border-blue-200 bg-white text-blue-600 hover:bg-blue-50 gap-1"
                                    >
                                        {sourceStatsLoading ? (
                                            <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                                        ) : (
                                            <BarChart2 className="h-3 w-3 text-blue-500" />
                                        )}
                                        {sourceStatsLoading ? "Аналіз..." : "Аналізувати Source"}
                                    </Button>
                                </div>

                                <StatsBlock stats={sourceStats} />

                                <div className="space-y-2 mt-3">
                                    {filesLoading ? (
                                        <div className="text-sm text-blue-500">Завантаження…</div>
                                    ) : sourceFiles.length === 0 ? (
                                        <div className="text-sm text-blue-400">Файлів немає</div>
                                    ) : (
                                        sourceFiles.map(f => (
                                            <div key={f.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white border border-blue-100">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-blue-900 truncate">{f.name}</p>
                                                </div>
                                                <Button
                                                    size="sm" variant="outline" className="h-7 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                                                    onClick={() => orderId && onDownloadSingleSource?.(orderId, f.id, f.name)} disabled={downloadLoading}
                                                >
                                                    Скачати
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* TARGET BLOCK */}
                            <div className="mt-4 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/30 to-white p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-emerald-900">Target</p>
                                        <Badge variant="outline" className="border-emerald-200 bg-white text-emerald-700">
                                            {filesLoading ? "..." : targetFiles.length}
                                        </Badge>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={filesLoading || targetStatsLoading || targetFiles.length === 0}
                                        onClick={() => orderId && onAnalyzeFolder?.(orderId, "target")}
                                        className="h-7 text-xs border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50 gap-1"
                                    >
                                        {targetStatsLoading ? (
                                            <Loader2 className="h-3 w-3 animate-spin text-emerald-600" />
                                        ) : (
                                            <BarChart2 className="h-3 w-3 text-emerald-500" />
                                        )}
                                        {targetStatsLoading ? "Аналіз..." : "Аналізувати Target"}
                                    </Button>
                                </div>

                                <StatsBlock stats={targetStats} />

                                <div className="space-y-2 mt-3">
                                    {filesLoading ? (
                                        <div className="text-sm text-emerald-500">Завантаження…</div>
                                    ) : targetFiles.length === 0 ? (
                                        <div className="text-sm text-emerald-400">Файлів немає</div>
                                    ) : (
                                        targetFiles.map(f => (
                                            <div key={f.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white border border-emerald-100">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-emerald-900 truncate">{f.name}</p>
                                                </div>
                                                <Button
                                                    size="sm" variant="outline" className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                                    onClick={() => orderId && onDownloadSingleTarget?.(orderId, f.id, f.name)} disabled={downloadLoading}
                                                >
                                                    Скачати
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* 👉 ДОДАНО: Компактна зона завантаження перекладу менеджером */}
                                {onUploadTarget && (
                                    <div className="mt-4 pt-3 border-t border-dashed border-emerald-200/80">
                                        <input
                                            type="file"
                                            multiple
                                            id="manager-target-upload"
                                            className="hidden"
                                            disabled={isUploadingTarget || filesLoading}
                                            onChange={async (e) => {
                                                const files = Array.from(e.target.files || []);
                                                if (files.length > 0 && onUploadTarget) {
                                                    await onUploadTarget(files);
                                                }
                                                e.target.value = ""; // Скидаємо інпут
                                            }}
                                        />
                                        <label
                                            htmlFor="manager-target-upload"
                                            className={`
                                                flex flex-col items-center justify-center p-4 border-2 border-dashed 
                                                border-emerald-200 rounded-lg cursor-pointer bg-white 
                                                hover:bg-emerald-50/40 transition-all text-center
                                                ${isUploadingTarget ? "opacity-50 pointer-events-none" : ""}
                                            `}
                                        >
                                            {isUploadingTarget ? (
                                                <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    <span>Завантаження перекладу в Dropbox...</span>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-emerald-700 font-medium flex items-center gap-2">
                                                    <FileUp className="h-4 w-4 text-emerald-500 animate-pulse" />
                                                    <span>Перетягніть сюди або натисніть, щоб додати файли в Target</span>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* Zip buttons */}
                            <div className="mt-4 flex justify-end gap-3">
                                <Button
                                    variant="outline" size="sm" onClick={onDownloadOriginal}
                                    disabled={filesLoading || downloadLoading || sourceFiles.length === 0}
                                    className="text-xs gap-1.5 border-gray-300 hover:bg-gray-50"
                                >
                                    <Download className="h-3.5 w-3.5" /> Скачати все (source)
                                </Button>
                                <Button
                                    variant="outline" size="sm" onClick={onDownloadTranslation}
                                    disabled={filesLoading || downloadLoading || targetFiles.length === 0}
                                    className="text-xs gap-1.5 border-blue-300 text-blue-600 hover:bg-blue-50"
                                >
                                    <Download className="h-3.5 w-3.5" /> Скачати все (target)
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="w-full sm:w-80 border-t sm:border-t-0 sm:border-l bg-gray-50 overflow-y-auto p-3 sm:p-4">
                        <div className="mb-6">
                            <Button className="w-full justify-between bg-blue-600 hover:bg-blue-700 text-white shadow-sm" variant="default">
                                <span className="font-medium">{status}</span>
                                <ChevronDown className="h-4 w-4 ml-2"/>
                            </Button>
                        </div>

                        <div className="space-y-1 bg-white rounded-lg border border-gray-200 p-1">
                            <button className="flex items-center justify-between w-full py-2.5 px-3 hover:bg-gray-50 rounded">
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

                            <div className="py-3 px-3 border-t">
                                <label className="text-xs text-gray-600 mb-2 block">Перекладач</label>
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 bg-green-100">
                                        <span className="text-xs font-semibold text-green-600">{translator?.charAt(0)?.toUpperCase() || '?'}</span>
                                    </div>
                                    <span className="text-sm font-medium">{translator || 'Не призначено'}</span>
                                </div>
                            </div>

                            <div className="py-3 px-3 border-t">
                                <label className="text-xs text-gray-600 mb-2 block">Редактор</label>
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 bg-orange-100">
                                        <span className="text-xs font-semibold text-orange-600">{editor?.charAt(0)?.toUpperCase() || '?'}</span>
                                    </div>
                                    <span className="text-sm font-medium">{editor || 'Не призначено'}</span>
                                </div>
                            </div>

                            <div className="py-3 px-3 border-t">
                                <label className="text-xs text-gray-600 mb-2 block">Пріоритет</label>
                                <div className="flex items-center gap-2">
                                    <span>{getPriorityIcon()}</span>
                                    <span className="text-sm font-medium capitalize">{priorityName || priority}</span>
                                </div>
                            </div>

                            <div className="py-3 px-3 border-t">
                                <label className="text-xs text-gray-600 mb-2 block">Термін виконання</label>
                                {dueDate ? (
                                    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg w-fit ${new Date(dueDate) < new Date() ? 'bg-red-50' : 'bg-blue-50'}`}>
                                        <Calendar className={`h-3.5 w-3.5 flex-shrink-0 ${new Date(dueDate) < new Date() ? 'text-red-500' : 'text-blue-500'}`} />
                                        <span className={`text-sm font-medium ${new Date(dueDate) < new Date() ? 'text-red-700' : 'text-blue-700'}`}>{dueDate}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-100 rounded-lg w-fit">
                                        <Calendar className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                        <span className="text-sm text-gray-400">Не вказано</span>
                                    </div>
                                )}
                            </div>

                            <div className="py-3 px-3 border-t">
                                <label className="text-xs text-gray-600 mb-2 block">Менеджер прийому</label>
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden bg-blue-100">
                                        <span className="text-xs font-semibold text-blue-600">{intake_manager?.name?.charAt(0)?.toUpperCase() || '?'}</span>
                                    </div>
                                    <span className="text-sm font-medium">{intake_manager?.name || 'Не призначено'}</span>
                                </div>
                            </div>

                            <div className="py-3 px-3 border-t">
                                <label className="text-xs text-gray-600 mb-2 block">Менеджер здачі</label>
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden bg-purple-100">
                                        <span className="text-xs font-semibold text-purple-600">{delivery_manager?.name?.charAt(0)?.toUpperCase() || '?'}</span>
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