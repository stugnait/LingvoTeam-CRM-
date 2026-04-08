"use client"

import { Button } from "@/src/components/ui/button"
import { useOrders } from "@/src/features/orders/hooks/useOrders"
import { useEffect, useState } from "react"
import { OrdersTable } from "@/src/features/orders/components/OrdersBlock"
import { Plus, LayoutList, KanbanSquare } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { CreateOrderModal } from "./CreateOrderForm"
import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"
import { Priority } from "@/src/components/ui/PrioritySelector"
import { cn } from "@/src/lib/utils"

import OrdersKanbanBoard from "./OrdersKanbanBoard"
import { TaskModal } from "@/src/components/modals/jira/InfoModal"

export default function OrdersPage() {
    const {
        createOrder,
        updateOrder,
        loading,
        orders,
        loadOrderDetails, // <--- Ця функція повертає дані для розкриття рядка в таблиці
        languagePairs,
        translatorsCache,
        clients,
        languages,
        editors,
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
        isOnlyMineFilter,
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
    const router = useRouter()

    useEffect(() => {
        if (!highlightId) {return}

        setActiveHighlightId(highlightId)

        const timer = setTimeout(() => {
            setActiveHighlightId(null)
            router.replace("/dashboard/orders", { scroll: false })
        }, 5000)

        return () => clearTimeout(timer)
    }, [highlightId, router])

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
            deadline: deadline ? deadline.toISOString() : undefined,
            priority,
            client_comment: comment,
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
        loadOrderDetails(id) // завантажуємо додаткові деталі у фоні
    }

    return (
        <div className="w-full max-w-full min-w-0 flex flex-col">
            <DashboardHeader />

            <div className="fixed bottom-8 right-8 z-40">
                <Button
                    onClick={handleCreateClick}
                    className="rounded-full w-14 h-14 p-0 shadow-lg bg-blue-600 hover:bg-blue-700 text-white transition-all hover:scale-110 active:scale-95"
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </div>

            <div className="space-y-6 w-full min-w-0 overflow-hidden px-1">
                <div className="flex justify-start pt-4 pl-4">
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
                            Table
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
                            Board
                        </button>
                    </div>
                </div>

                <div className="w-full min-w-0 pb-6">
                    {viewMode === "table" ? (
                        <OrdersTable
                            orders={orders}
                            page={page}
                            totalPages={totalPages}
                            onPageChange={onPageChange}
                            isOnlyMineFilter={isOnlyMineFilter}
                            onFilterChange={(onlyMine) => loadOrders(1, onlyMine)}

                            // 👉 ДЛЯ ТАБЛИЦІ: передаємо loadOrderDetails, щоб рядок розгортався вниз!
                            onOpen={loadOrderDetails}

                            languagePairs={languagePairs}
                            translatorsCache={translatorsCache}
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
                    manager={viewingOrder.manager_name || 'Unassigned'}
                    translator={viewingOrder.translator_name || 'Unassigned'}
                    onDownloadOriginal={() => downloadOrderSourceFiles(viewingOrder.id)}
                    onDownloadTranslation={() => downloadOrderTargetFiles(viewingOrder.id)}
                    onCancel={() => setIsViewModalOpen(false)}
                    onSave={() => setIsViewModalOpen(false)}
                />
            )}
        </div>
    )
}