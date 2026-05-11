// src/features/orders/components/MainOrder.tsx
"use client"

import { Button } from "@/src/components/ui/button"
import { useOrders } from "@/src/features/orders/hooks/useOrders"
import { useEffect, useState } from "react"
import { OrdersTable } from "@/src/features/orders/components/OrdersBlock"
import { Plus, LayoutList, KanbanSquare } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { CreateOrderModal } from "./CreateOrderForm"
import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"
import type { Priority } from "@/src/components/ui/PrioritySelector"
import { cn } from "@/src/lib/utils"

import OrdersKanbanBoard from "./OrdersKanbanBoard"
import { TaskModal } from "@/src/components/modals/jira/InfoModal"

export default function OrdersPage() {
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
    } = useOrders()

    const [viewMode, setViewMode] = useState<"table" | "kanban">("table")

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingOrder, setEditingOrder] = useState<any | null>(null)

    // Стан для перегляду ДЕТАЛЬНОЇ ІНФОРМАЦІЇ ордера (модалка для Kanban дошки)
    const [viewingOrder, setViewingOrder] = useState<any | null>(null)
    const [isViewModalOpen, setIsViewModalOpen] = useState(false)

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

    useEffect(() => {
        if (!highlightId) {return}

        setActiveHighlightId(highlightId)

        const timer = setTimeout(() => {
            setActiveHighlightId(null)
            router.replace("/dashboard/orders", { scroll: false })
        }, 5000)

        return () => clearTimeout(timer)
    }, [highlightId, router])

    const formatDate = (dateString?: string) => {
        if (!dateString) {return 'Не вказано';}
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('uk-UA', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }).format(date);
        } catch (e) {
            return dateString;
        }
    };

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

            // 👇 ДОДАЙ ЦЕЙ РЯДОК (якщо пуста строка, передаємо undefined, щоб бек сам порахував)
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

    // 👉 ФУНКЦІЯ ДЛЯ ДОШКИ: Відкриває модальне вікно картки
    const handleViewDetailsBoard = (id: number) => {
        const order = orders.find(o => o.id === id)
        if (order) {
            setViewingOrder(order)
            setIsViewModalOpen(true)
        }
        loadOrderDetails(id)
    }

    return (
        <div className="w-full max-w-full min-w-0 flex flex-col">
            <DashboardHeader />

            <div className="space-y-6 w-full min-w-0 overflow-hidden px-4 md:px-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6">
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode("table")}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                                viewMode === "table"
                                    ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600"
                                    : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <LayoutList className="w-4 h-4"/>
                            Таблиця
                        </button>
                        <button
                            onClick={() => setViewMode("kanban")}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                                viewMode === "kanban"
                                    ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600"
                                    : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <KanbanSquare className="w-4 h-4"/>
                            Канбан
                        </button>
                    </div>

                    <Button
                        onClick={handleCreateClick}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-2 px-6"
                    >
                        <Plus className="w-5 h-5" />
                        Створити замовлення
                    </Button>
                </div>

                <div className="w-full min-w-0 pb-6">
                    {viewMode === "table" ? (
                        <OrdersTable
                            orders={orders}
                            page={page}
                            totalPages={totalPages}
                            onPageChange={onPageChange}

                            // 👉 ПЕРЕДАЄМО ФІЛЬТРИ В ТАБЛИЦЮ:
                            isOnlyMineFilter={isOnlyMineFilter}
                            onFilterChange={handleFilterChange}
                            statusFilter={statusFilter}
                            onStatusChange={handleStatusChange}
                            managerFilter={managerFilter}
                            onManagerChange={handleManagerChange}
                            dateFromFilter={dateFromFilter}
                            onDateFromChange={handleDateFromChange}
                            dateToFilter={dateToFilter}
                            onDateToChange={handleDateToChange}

                            // ТУТ ЗМІНА: передаємо managers замість editors
                            managers={managers || []}

                            onOpen={loadOrderDetails}
                            languagePairs={languagePairs}
                            translatorsCache={translatorsCache}
                            clients={clients || []}
                            highlightId={activeHighlightId}
                            confirmOrder={confirmOrder}
                            downloadOrderSourceFiles={downloadOrderSourceFiles}
                            downloadOrderTargetFiles={downloadOrderTargetFiles}
                            onEdit={handleEdit}
                            onDelete={(id) => deleteOrder(id)}
                        />
                    ) : (
                        <OrdersKanbanBoard
                            orders={orders}
                            updateOrder={updateOrder}

                            // 👉 ДЛЯ ДОШКИ: передаємо handleViewDetailsBoard, щоб відкрити модалку!
                            onTaskOpen={handleViewDetailsBoard}
                        />
                    )}
                </div>
            </div>

            <CreateOrderModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSubmit={handleSubmit}
                loading={loading}

                mode={editingOrder ? "edit" : "create"}
                orderId={editingOrder?.id}

                clientId={clientId}
                setClientId={setClientId}

                sourceLanguage={sourceLanguage}
                setSourceLanguage={setSourceLanguage}
                targetLanguage={targetLanguage}
                setTargetLanguage={setTargetLanguage}

                files={files}
                setFiles={setFiles}

                trafficId={trafficId}
                setTrafficId={setTrafficId}

                currencyId={currencyId}
                setCurrencyId={setCurrencyId}

                selectedTranslatorId={selectedTranslatorId}
                setSelectedTranslatorId={setSelectedTranslatorId}

                editor={editor}
                setEditor={setEditor}

                translatorTrafficId={translatorTrafficId}
                setTranslatorTrafficId={setTranslatorTrafficId}

                deadline={deadline}
                setDeadline={setDeadline}

                comment={comment}
                setComment={setComment}

                priority={priority}
                setPriority={setPriority}

                clients={clients || []}
                languages={languages || []}
                editors={editors || []}
                currencies={currencies || []}
                translators={translators || []}
                tariffs={traffics || []}

                managerAccept={managerAccept}
                setManagerAccept={setManagerAccept}
                managerDelivery={managerDelivery}
                setManagerDelivery={setManagerDelivery}
                managers={managers || []}

                onRefreshTranslators={refreshTranslators}

                totalAmount={totalAmount}
                setTotalAmount={setTotalAmount}
            />

            {viewingOrder && (
                <TaskModal
                    open={isViewModalOpen}
                    onOpenChange={setIsViewModalOpen}
                    taskId={viewingOrder.id.toString()}
                    taskTitle={viewingOrder.language_pair_name || `Order #${viewingOrder.id}`}
                    taskDescription={viewingOrder.client_comment || 'No comment'}
                    status={viewingOrder.status_name || viewingOrder.status || 'all_orders'}
                    priority={viewingOrder.priority || 'medium'}
                    intake_manager={viewingOrder.manager_accept_id ? {
                        id: viewingOrder.manager_accept_id,
                        name: viewingOrder.manager_accept_name || 'Сук',
                        avatar: viewingOrder.manager_accept_avatar ?? undefined
                    } : null}
                    delivery_manager={viewingOrder.manager_delivery_id ? {
                        id: viewingOrder.manager_delivery_id,
                        name: viewingOrder.manager_delivery_name || 'Сук',
                        avatar: viewingOrder.manager_delivery_avatar ?? undefined
                    } : null}
                    translator={viewingOrder.translator_name || 'Unassigned'}
                    editor={viewingOrder.editor_name || 'Unassigned'}
                    dueDate={formatDate(viewingOrder.deadline) || "Unsettled"}
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
                />
            )}
        </div>
    )
}