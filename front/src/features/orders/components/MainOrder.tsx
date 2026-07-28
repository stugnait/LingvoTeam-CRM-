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

// Імпорти для модального вікна вибору email (без RadioGroup)
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/src/components/ui/dialog"

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
        handleSearchChange,
        updateClientStatusLoading,
        deleteLoading,
        deleteFileLoading,
        deleteOrderFile
    } = useOrders()

    const { user } = useProfile()

    const [viewMode, setViewMode] = useState<"table" | "kanban">("table")
    const [isOnlyMine, setIsOnlyMine] = useState(false)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingOrder, setEditingOrder] = useState<any | null>(null)

    const [viewingOrder, setViewingOrder] = useState<any | null>(null)
    const [isViewModalOpen, setIsViewModalOpen] = useState(false)

    const [sourceStats, setSourceStats] = useState<any | null>(null)
    const [sourceStatsLoading, setSourceStatsLoading] = useState(false)
    const [targetStats, setTargetStats] = useState<any | null>(null)
    const [targetStatsLoading, setTargetStatsLoading] = useState(false)

    const [isUploadingTarget, setIsUploadingTarget] = useState(false)

    // Стейт для модалки вибору email при підтвердженні ордера
    const [confirmModalData, setConfirmModalData] = useState<{ isOpen: boolean, orderId: number, emails: string[] } | null>(null)
    const [selectedConfirmEmail, setSelectedConfirmEmail] = useState<string>("")

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

    const [isUploadingSource, setIsUploadingSource] = useState(false)

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


    // Функція-перехоплювач підтвердження
    const handleConfirmOrderRequest = async (orderId: number) => {
        const orderToConfirm = orders.find(o => o.id === orderId)

        // Беремо ID з того, що прийшло (на скріншоті чітко видно client_id)
        const currentClientId = orderToConfirm?.client_id

        // Шукаємо повного клієнта в масиві clients (приводимо до Number для надійності)
        const fullClient = clients.find(c => Number(c.id) === Number(currentClientId))

        let clientEmails: string[] = []

        // Перевіряємо і новий масив emails, і старе поле email (раптом що)
        if (fullClient?.emails && Array.isArray(fullClient.emails) && fullClient.emails.length > 0) {
            clientEmails = fullClient.emails
        } else if (fullClient?.email) {
            clientEmails = [fullClient.email]
        }

        // Якщо знайшли хоча б один емейл - завжди показуємо модалку
        if (clientEmails.length > 0) {
            setConfirmModalData({ isOpen: true, orderId, emails: clientEmails })
            setSelectedConfirmEmail(clientEmails[0])
        } else {
            alert(`У клієнта ${orderToConfirm?.client_name} не вказано жодного email. Замовлення буде підтверджено, але лист не надіслано.`)
            confirmOrder(orderId, "")
        }
    }


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

    const handleUploadSourceFiles = async (files: File[]) => {
        if (!viewingOrder) return false
        try {
            setIsUploadingSource(true)
            const formData = new FormData()
            files.forEach(file => formData.append('files', file))

            await ordersApi.uploadSourceFiles(viewingOrder.id, formData)

            loadOrderFiles(viewingOrder.id)
            return true
        } catch (error) {
            console.error("Помилка при завантаженні файлів у Source менеджером:", error)
            return false
        } finally {
            setIsUploadingSource(false)
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

    const handleEdit = async (order: any) => {
        try {
            const details = await loadOrderDetails(order.id)
            await loadOrderFiles(order.id)

            const merged = { ...order, ...details }
            setEditingOrder(merged)

            const cId = merged.client?.id || merged.client_id
            setClientId(cId ? String(cId) : "")

            const sLang = languages.find(l => l.id === merged.source_language_id || l.name === merged.source_language)
            setSourceLanguage(sLang ? String(sLang.id) : "")

            const tLang = languages.find(l => l.id === merged.target_language_id || l.name === merged.target_language)
            setTargetLanguage(tLang ? String(tLang.id) : "")

            setTrafficId(String(merged.traffic_id ?? ""))
            setCurrencyId(String(merged.currency_id ?? ""))
            setLanguagePairId(String(merged.language_pair_id ?? ""))

            const edId = merged.editor?.id || merged.editor_id
            setEditor(edId ? String(edId) : "")

            const trId = merged.translator?.id || merged.translator_id
            setSelectedTranslatorId(trId ? Number(trId) : null)
            setTranslatorTrafficId(String(merged.translator_traffic_id ?? ""))

            setManagerAccept(String(merged.manager_accept_id ?? ""))
            setManagerDelivery(String(merged.manager_delivery_id ?? ""))

            setDeadline(merged.deadline ? new Date(merged.deadline) : undefined)
            setComment(merged.client_comment ?? merged.comment ?? "")
            setPriority(merged.priority ?? undefined)
            setTotalAmount(String(merged.total_client_price ?? merged.total_amount ?? ""))

            setIsModalOpen(true)
        } catch (error) {
            console.error("Помилка завантаження деталей для редагування:", error)
        }
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

    const handleUploadTargetFiles = async (files: File[]) => {
        if (!viewingOrder) return false
        try {
            setIsUploadingTarget(true)
            const formData = new FormData()
            files.forEach(file => formData.append('files', file))

            await ordersApi.uploadTargetFiles(viewingOrder.id, formData)

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

                            // Передаємо наш перехоплювач замість прямого виклику
                            confirmOrder={handleConfirmOrderRequest}

                            downloadOrderSourceFiles={downloadOrderSourceFiles}
                            downloadOrderTargetFiles={downloadOrderTargetFiles} onEdit={handleEdit}
                            onDelete={(id) => deleteOrder(id)} updateOrder={updateOrder}
                            searchFilter={searchFilter} onSearchChange={handleSearchChange}
                            updateClientStatus={handleUpdateClientStatus} updateClientStatusLoading={updateClientStatusLoading}
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
                sourceFiles={sourceFiles}
                onDownloadFile={(fileId, filename) => editingOrder && downloadSingleSourceFile(editingOrder.id, fileId, filename)}
                onDeleteFile={(fileId) => editingOrder && deleteOrderFile(editingOrder.id, fileId)}
                deleteFileLoadingId={deleteFileLoading}
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

                    onUploadSource={handleUploadSourceFiles}
                    isUploadingSource={isUploadingSource}
                    onDeleteFile={(orderId, fileId) => deleteOrderFile(orderId, fileId)}
                    deleteFileLoadingId={deleteFileLoading}

                    onEdit={() => {
                        setIsViewModalOpen(false)
                        handleEdit(viewingOrder)
                    }}
                    onDelete={() => {
                        setIsViewModalOpen(false)
                        deleteOrder(viewingOrder.id)
                    }}

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

                    onUploadTarget={handleUploadTargetFiles}
                    isUploadingTarget={isUploadingTarget}
                />
            )}

            {/* Модалка вибору email для підтвердження зі стандартними HTML input radio */}
            <Dialog open={confirmModalData?.isOpen} onOpenChange={(open) => !open && setConfirmModalData(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Оберіть email для відправки</DialogTitle>
                        <DialogDescription>
                            У цього клієнта є декілька email-адрес. Оберіть, на яку саме відправити готове замовлення.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 flex flex-col gap-3">
                        {confirmModalData?.emails.map(email => (
                            <label key={email} className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="confirm-email"
                                    value={email}
                                    checked={selectedConfirmEmail === email}
                                    onChange={(e) => setSelectedConfirmEmail(e.target.value)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span className="font-medium text-sm">{email}</span>
                            </label>
                        ))}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmModalData(null)}>Скасувати</Button>
                        <Button
                            disabled={!selectedConfirmEmail}
                            onClick={() => {
                                if (confirmModalData) {
                                    confirmOrder(confirmModalData.orderId, selectedConfirmEmail)
                                    setConfirmModalData(null)
                                }
                            }}
                        >
                            Відправити
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}