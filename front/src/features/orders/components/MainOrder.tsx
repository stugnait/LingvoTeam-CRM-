// src/features/orders/components/MainOrder.tsx
"use client"

import { Button } from "@/src/components/ui/button"
import { useOrders } from "@/src/features/orders/hooks/useOrders"
import { useEffect, useState } from "react"
import { OrdersTable } from "@/src/features/orders/components/OrdersBlock"
import { Plus, LayoutList, KanbanSquare, Filter } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { CreateOrderModal } from "./CreateOrderForm"
import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"
import type { Priority } from "@/src/components/ui/PrioritySelector"
import { cn } from "@/src/lib/utils"
import { useProfile } from "@/src/features/profile/hooks/useProfile"

import { ordersApi } from "@/src/features/orders/api"
import OrdersKanbanBoard from "./OrdersKanbanBoard"
import { TaskModal } from "@/src/components/modals/jira/InfoModal"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

export default function OrdersPage() {
    const { locale, t } = useI18n()

    const {
        createOrder,
        updateOrder,
        loading,
        orders,
        loadOrderDetails,
        languagePairs,
        translatorsCache,
        clients,
        languages,
        editors,
        managers,
        currencies,
        translators,
        traffics,
        confirmOrder,
        deleteOrder,
        downloadOrderSourceFiles,
        downloadOrderTargetFiles,
        page,
        totalPages,
        onPageChange,
        loadOrders,
        refreshTranslators,

        isOnlyMineFilter,
        statusFilter,
        managerFilter,
        dateFromFilter,
        dateToFilter,
        handleFilterChange,
        handleStatusChange,
        handleManagerChange,
        handleDateFromChange,
        handleDateToChange,

        sourceFiles,
        targetFiles,
        filesLoading,
        downloadLoading,
        loadOrderFiles,
        downloadSingleSourceFile,
        downloadSingleTargetFile,
        searchFilter,
        handleSearchChange
    } = useOrders()

    const { user } = useProfile()

    const [viewMode, setViewMode] = useState<"table" | "kanban">("table")
    const [isOnlyMine, setIsOnlyMine] = useState(false)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingOrder, setEditingOrder] = useState<any | null>(null)

    const [viewingOrder, setViewingOrder] = useState<any | null>(null)
    const [isViewModalOpen, setIsViewModalOpen] = useState(false)

    // Результати аналізу парок
    const [sourceStats, setSourceStats] = useState<any | null>(null)
    const [sourceStatsLoading, setSourceStatsLoading] = useState(false)
    const [targetStats, setTargetStats] = useState<any | null>(null)
    const [targetStatsLoading, setTargetStatsLoading] = useState(false)

    // 👉 ДОДАНО: Стан завантаження для target-файлів менеджером
    const [isUploadingTarget, setIsUploadingTarget] = useState(false)

    const [clientId, setClientId] = useState("")
    const [sourceLanguage, setSourceLanguage] = useState("")
    const [targetLanguage, setTargetLanguage] = useState("")
    const [editor, setEditor] = useState("")
    const [trafficId, setTrafficId] = useState("")
    const [languagePairId, setLanguagePairId] = useState("")
    const [translatorTrafficId, setTranslatorTrafficId] = useState("")
    const [currencyId, setCurrencyId] = useState("")
    const [selectedTranslatorId, setSelectedTranslatorId] = useState<number | null>(null)
    const [files, setFiles] = useState<File[]>([])

    const [deadline, setDeadline] = useState<Date | undefined>(undefined)
    const [comment, setComment] = useState("")
    const [priority, setPriority] = useState<Priority | undefined>(undefined)

    const searchParams = useSearchParams()
    const highlightId = Number(searchParams.get("highlight"))
    const [activeHighlightId, setActiveHighlightId] = useState<number | null>(null)
    const [managerAccept, setManagerAccept] = useState("")
    const [managerDelivery, setManagerDelivery] = useState("")
    const router = useRouter()
    const [totalAmount, setTotalAmount] = useState("")

    const handleUpdateClientStatus = async (orderId: number, statusId: number) => {
        try {
            await updateOrder(orderId, { client_status: statusId })
        } catch (error) {
            console.error("Помилка при оновленні статусу оплати:", error)
        }
    }

    useEffect(() => {
        if (!highlightId) { return }
        setActiveHighlightId(highlightId)
        const timer = setTimeout(() => {
            setActiveHighlightId(null)
            router.replace("/dashboard/orders", { scroll: false })
        }, 5000)
        return () => clearTimeout(timer)
    }, [highlightId, router])

    const formatDate = (dateString?: string) => {
        if (!dateString) { return t("common.notSet") }
        try {
            const date = new Date(dateString)
            return new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : "en-US", {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }).format(date)
        } catch (e) {
            return dateString
        }
    }

    const resetForm = () => {
        setClientId("")
        setSourceLanguage("")
        setTargetLanguage("")
        setLanguagePairId("")
        setTranslatorTrafficId("")
        setTrafficId("")
        setEditor("")
        setCurrencyId("")
        setSelectedTranslatorId(null)
        setFiles([])
        setDeadline(undefined)
        setComment("")
        setPriority(undefined)
        setEditingOrder(null)
        setManagerAccept("")
        setManagerDelivery("")
        setTotalAmount("")
    }

    const handleCreateClick = () => {
        resetForm()
        setIsModalOpen(true)
    }

    const handleEdit = (order: any) => {
        setEditingOrder(order)
        setClientId(String(order.client_id ?? ""))
        setSourceLanguage(String(order.source_language ?? ""))
        setTargetLanguage(String(order.target_language ?? ""))
        setTrafficId(String(order.traffic_id ?? ""))
        setCurrencyId(String(order.currency_id ?? ""))
        setEditor(String(order.editor_id ?? ""))
        setLanguagePairId(String(order.language_pair_id ?? ""))
        setTranslatorTrafficId(String(order.translator_traffic_id ?? ""))
        setSelectedTranslatorId(order.translator_id ?? null)
        setDeadline(order.deadline ? new Date(order.deadline) : undefined)
        setComment(order.client_comment ?? "")
        setPriority(order.priority ?? undefined)
        setIsModalOpen(true)
        setManagerAccept(String(order.manager_accept_id ?? ""))
        setManagerDelivery(String(order.manager_delivery_id ?? ""))
    }

    const handleSubmit = async () => {
        const payload = {
            client_id: Number(clientId),
            source_language: Number(sourceLanguage),
            target_language: Number(targetLanguage),
            traffic_id: Number(trafficId),
            translator_traffic_id: Number(translatorTrafficId),
            currency_id_id: Number(currencyId),
            language_pair_id: Number(languagePairId),
            editor_id: Number(editor),
            translator_id: selectedTranslatorId ?? undefined,
            files,
            deadline: (deadline ? deadline.toISOString() : undefined) as any,
            priority,
            client_comment: comment,
            manager_accept_id: managerAccept ? Number(managerAccept) : undefined,
            manager_delivery_id: managerDelivery ? Number(managerDelivery) : undefined,
            total_amount: totalAmount ? totalAmount : undefined,
        }

        if (editingOrder) {
            await updateOrder(editingOrder.id, payload)
        } else {
            await createOrder(payload)
        }
        resetForm()
        setIsModalOpen(false)
    }

    const handleFilterChangeSync = (onlyMine: boolean) => {
        setIsOnlyMine(onlyMine)
        handleFilterChange(onlyMine)
    }

    const handleViewDetailsBoard = (id: number) => {
        setSourceStats(null)
        setTargetStats(null)
        const order = orders.find(o => o.id === id)
        if (order) {
            setViewingOrder(order)
            setIsViewModalOpen(true)
        }
        loadOrderDetails(id)
        loadOrderFiles(id)
    }

    const handleAnalyzeFolderFiles = async (orderId: number, folder: "source" | "target") => {
        if (folder === "source") {
            try {
                setSourceStatsLoading(true)
                const res = await ordersApi.analyzeFolderFiles(orderId, "source")
                setSourceStats(res)
            } catch (e) {
                console.error("Помилка прорахунку source папки", e)
            } finally {
                setSourceStatsLoading(false)
            }
        } else {
            try {
                setTargetStatsLoading(true)
                const res = await ordersApi.analyzeFolderFiles(orderId, "target")
                setTargetStats(res)
            } catch (e) {
                console.error("Помилка прорахунку target папки", e)
            } finally {
                setTargetStatsLoading(false)
            }
        }
    }

    // 👉 ДОДАНО: Функція завантаження файлів у Target папку замовлення менеджером
    const handleUploadTargetFiles = async (files: File[]) => {
        if (!viewingOrder) return false
        try {
            setIsUploadingTarget(true)
            const formData = new FormData()
            files.forEach(file => formData.append('files', file))

            await ordersApi.uploadTargetFiles(viewingOrder.id, formData)

            // Після завантаження автоматично оновлюємо файлову структуру в модалці
            loadOrderFiles(viewingOrder.id)
            return true
        } catch (error) {
            console.error("Помилка при завантаженні файлів у Target менеджером:", error)
            return false
        } finally {
            setIsUploadingTarget(false)
        }
    }

    return (
        <div className="w-full max-w-full min-w-0 flex flex-col">
            <DashboardHeader />

            <div className="space-y-6 w-full min-w-0 overflow-hidden px-4 md:px-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-6">
                    <div className="flex flex-col gap-4 pt-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full">
                            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-full sm:w-auto">
                                <button
                                    onClick={() => setViewMode("table")}
                                    className={cn(
                                        "flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all",
                                        viewMode === "table" ? "bg-white shadow-sm text-blue-600" : "text-gray-500"
                                    )}
                                >
                                    <LayoutList className="w-4 h-4" /> <span>{t("common.table")}</span>
                                </button>
                                <button
                                    onClick={() => setViewMode("kanban")}
                                    className={cn(
                                        "flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all",
                                        viewMode === "kanban" ? "bg-white shadow-sm text-blue-600" : "text-gray-500"
                                    )}
                                >
                                    <KanbanSquare className="w-4 h-4" /> <span>{t("common.kanban")}</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100 self-start">
                            <Filter className="w-4 h-4 text-muted-foreground shrink-0 ml-1" />
                            <div className="flex bg-muted/50 p-1 rounded-lg">
                                <button onClick={() => handleFilterChangeSync(false)} className={cn("px-4 py-1.5 text-sm font-medium rounded-md", !isOnlyMine ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>{t("common.allOrders")}</button>
                                <button onClick={() => handleFilterChangeSync(true)} className={cn("px-4 py-1.5 text-sm font-medium rounded-md", isOnlyMine ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>{t("common.myOrders")}</button>
                            </div>
                        </div>
                    </div>

                    <Button onClick={handleCreateClick} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center justify-center gap-2 px-6">
                        <Plus className="w-5 h-5" /> {t("orders.create")}
                    </Button>
                </div>

                <div className="w-full min-w-0 pb-6">
                    {viewMode === "table" ? (
                        <OrdersTable
                            orders={orders} page={page} totalPages={totalPages} onPageChange={onPageChange}
                            isOnlyMineFilter={isOnlyMine} onFilterChange={handleFilterChangeSync}
                            statusFilter={statusFilter} onStatusChange={handleStatusChange}
                            managerFilter={managerFilter} onManagerChange={handleManagerChange}
                            dateFromFilter={dateFromFilter} onDateFromChange={handleDateFromChange}
                            dateToFilter={dateToFilter} onDateToChange={handleDateToChange}
                            managers={managers || []} onOpen={loadOrderDetails} languagePairs={languagePairs}
                            translatorsCache={translatorsCache} clients={clients || []} highlightId={activeHighlightId}
                            confirmOrder={confirmOrder} downloadOrderSourceFiles={downloadOrderSourceFiles}
                            downloadOrderTargetFiles={downloadOrderTargetFiles} onEdit={handleEdit}
                            onDelete={(id) => deleteOrder(id)} updateOrder={updateOrder}
                            searchFilter={searchFilter} onSearchChange={handleSearchChange}
                            updateClientStatus={handleUpdateClientStatus} updateClientStatusLoading={loading}
                            onTaskOpen={handleViewDetailsBoard}
                        />
                    ) : (
                        <OrdersKanbanBoard orders={orders} updateOrder={updateOrder} onTaskOpen={handleViewDetailsBoard} currentUserId={user?.id ? Number(user.id) : 0} isOnlyMine={isOnlyMine} />
                    )}
                </div>
            </div>

            <CreateOrderModal
                open={isModalOpen} onOpenChange={setIsModalOpen} onSubmit={handleSubmit} loading={loading}
                mode={editingOrder ? "edit" : "create"} orderId={editingOrder?.id} clientId={clientId} setClientId={setClientId}
                sourceLanguage={sourceLanguage} setSourceLanguage={setSourceLanguage} targetLanguage={targetLanguage} setTargetLanguage={setTargetLanguage}
                files={files} setFiles={setFiles} trafficId={trafficId} setTrafficId={setTrafficId} currencyId={currencyId} setCurrencyId={setCurrencyId}
                selectedTranslatorId={selectedTranslatorId} setSelectedTranslatorId={setSelectedTranslatorId} editor={editor} setEditor={setEditor}
                translatorTrafficId={translatorTrafficId} setTranslatorTrafficId={setTranslatorTrafficId} deadline={deadline} setDeadline={setDeadline}
                comment={comment} setComment={setComment} priority={priority} setPriority={setPriority} clients={clients || []}
                languages={languages || []} editors={editors || []} currencies={currencies || []} translators={translators || []}
                tariffs={traffics || []} managerAccept={managerAccept} setManagerAccept={setManagerAccept} managerDelivery={managerDelivery}
                setManagerDelivery={setManagerDelivery} managers={managers || []} onRefreshTranslators={refreshTranslators}
                totalAmount={totalAmount} setTotalAmount={setTotalAmount}
            />

            {viewingOrder && (
                <TaskModal
                    open={isViewModalOpen}
                    onOpenChange={setIsViewModalOpen}
                    taskId={viewingOrder.id.toString()}
                    taskTitle={viewingOrder.language_pair_name || t("orders.orderNumber", { id: viewingOrder.id })}
                    taskDescription={viewingOrder.client_comment || t("common.noComment")}
                    status={viewingOrder.status_name || viewingOrder.status || 'all_orders'}
                    priority={viewingOrder.priority || 'medium'}
                    intake_manager={viewingOrder.manager_accept_id ? { id: viewingOrder.manager_accept_id, name: viewingOrder.manager_accept_name || 'Сук' } : null}
                    delivery_manager={viewingOrder.manager_delivery_id ? { id: viewingOrder.manager_delivery_id, name: viewingOrder.manager_delivery_name || 'Сук' } : null}
                    translator={viewingOrder.translator_name || t("common.notAssigned")}
                    editor={viewingOrder.editor_name || t("common.notAssigned")}
                    dueDate={formatDate(viewingOrder.deadline) || t("common.notSet")}
                    onDownloadOriginal={() => downloadOrderSourceFiles(viewingOrder.id)}
                    onDownloadTranslation={() => downloadOrderTargetFiles(viewingOrder.id)}
                    onCancel={() => setIsViewModalOpen(false)}
                    onSave={() => setIsViewModalOpen(false)}

                    orderId={viewingOrder.id}
                    sourceFiles={sourceFiles}
                    targetFiles={targetFiles}
                    filesLoading={filesLoading}
                    downloadLoading={downloadLoading}
                    onLoadFiles={loadOrderFiles}
                    onDownloadSingleSource={downloadSingleSourceFile}
                    onDownloadSingleTarget={downloadSingleTargetFile}

                    sourceStats={sourceStats}
                    sourceStatsLoading={sourceStatsLoading}
                    targetStats={targetStats}
                    targetStatsLoading={targetStatsLoading}
                    onAnalyzeFolder={handleAnalyzeFolderFiles}

                    // 👉 ПРОКИДАЄМО ФУНКЦІЮ ЗАВАНТАЖЕННЯ І СТАН
                    onUploadTarget={handleUploadTargetFiles}
                    isUploadingTarget={isUploadingTarget}
                />
            )}
        </div>
    )
}
