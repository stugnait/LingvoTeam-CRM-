"use client"

import {Fragment, useEffect, useState} from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/src/components/ui/table"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import {
    MoreHorizontal,
    Pencil,
    Trash2,
    ChevronDown,
    ChevronUp,
    Filter
} from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"

import type {
    OrderListItem,
    LanguagePair,
    Translator,
    Details,
    Client
} from "@/src/features/orders/types"
import {cn} from "@/src/lib/utils";

interface OrdersTableProps {
    orders: OrderListItem[]
    page: number
    totalPages: number
    onPageChange: (page: number) => void

    isOnlyMineFilter: boolean
    onFilterChange: (onlyMine: boolean) => void

    onOpen: (orderId: number) => Promise<Details>
    languagePairs: Record<number, LanguagePair>
    translatorsCache: Record<number, Translator>
    clients: Client[]

    highlightId?: number | null

    confirmOrder: (orderId: number) => Promise<any>
    downloadOrderSourceFiles: (orderId: number) => Promise<void>
    downloadOrderTargetFiles: (orderId: number) => Promise<void>

    onEdit?: (order: OrderListItem) => void
    onDelete: (orderId: number) => void
}

export function OrdersTable({
                                orders,
                                page,
                                totalPages,
                                onPageChange,
                                isOnlyMineFilter,
                                onFilterChange,
                                onOpen,
                                languagePairs,
                                translatorsCache,
                                clients,
                                highlightId,
                                confirmOrder,
                                downloadOrderSourceFiles,
                                downloadOrderTargetFiles,
                                onEdit,
                                onDelete
                            }: OrdersTableProps) {
    const [expandedId, setExpandedId] = useState<number | null>(null)
    const [details, setDetails] = useState<Details | null>(null)
    const [loadingId, setLoadingId] = useState<number | null>(null)
    const [activeHighlightId, setActiveHighlightId] = useState<number | null>(null)

    const handleToggle = async (orderId: number) => {
        if (expandedId === orderId) {
            setExpandedId(null)
            setDetails(null)
            return
        }

        setExpandedId(orderId)
        setLoadingId(orderId)

        const res = await onOpen(orderId)
        setDetails(res)
        setLoadingId(null)
    }

    useEffect(() => {
        if (!highlightId) {return}
        setActiveHighlightId(highlightId)
        const timer = setTimeout(() => setActiveHighlightId(null), 5000)
        return () => clearTimeout(timer)
    }, [highlightId])

    useEffect(() => {
        setExpandedId(null)
        setDetails(null)
    }, [page])

    const isOverdue = (deadline: string) => new Date(deadline).getTime() < Date.now()

    const getStatusVariant = (status: string) => status === "completed" ? "default" : "warning"

    const getTranslatorName = (translatorId: number | null) => {
        if (!translatorId) {return "—"}
        const translator = translatorsCache[translatorId]
        return translator?.full_name || `Translator #${translatorId}`
    }

    return (
        <div className="border border-border rounded-lg bg-card mx-4 my-6 shadow-soft overflow-hidden">

            {/* Панель інструментів таблиці (з перемикачем) */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/10">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Filter:</span>
                    <div className="flex bg-muted/50 p-1 rounded-lg ml-2">
                        <button
                            onClick={() => onFilterChange(false)}
                            className={cn(
                                "px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
                                !isOnlyMineFilter
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            All Orders
                        </button>
                        <button
                            onClick={() => onFilterChange(true)}
                            className={cn(
                                "px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
                                isOnlyMineFilter
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            My Orders
                        </button>
                    </div>
                </div>
            </div>

            <Table className="w-full">
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold text-foreground h-14 pl-6">ID</TableHead>
                        <TableHead className="font-semibold text-foreground h-14">Client</TableHead>
                        <TableHead className="font-semibold text-foreground h-14">Languages</TableHead>
                        <TableHead className="font-semibold text-foreground h-14">Status</TableHead>
                        <TableHead className="font-semibold text-foreground h-14">Deadline</TableHead>
                        <TableHead className="font-semibold text-foreground h-14">Priority</TableHead>
                        <TableHead className="font-semibold text-foreground h-14 pr-6 text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {orders.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                No orders found.
                            </TableCell>
                        </TableRow>
                    ) : orders.map((order) => (
                        <Fragment key={order.id}>
                            <TableRow
                                className={cn(
                                    "transition-colors hover:bg-muted/30",
                                    order.id === highlightId && "bg-primary/10 ring-2 ring-primary",
                                    isOverdue(order.deadline) && "bg-red-500/10 hover:bg-red-500/15"
                                )}
                            >
                                <TableCell className="align-middle h-16 pl-6">
                                    <div className="font-medium text-foreground">#{order.id}</div>
                                </TableCell>

                                <TableCell className="align-middle h-16">
                                    <div>
                                        <p className="font-medium text-foreground">
                                            {getTranslatorName(order.translator_id)}
                                        </p>
                                        {translatorsCache[order.translator_id]?.email && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {translatorsCache[order.translator_id].email}
                                            </p>
                                        )}
                                    </div>
                                </TableCell>

                                <TableCell className="align-middle h-16">
                                    <div className="flex items-center gap-2">
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-foreground border border-border">
                                            {order.source_language}
                                        </span>
                                        <span className="text-muted-foreground text-sm font-medium">→</span>
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                                            {order.target_language}
                                        </span>
                                    </div>
                                </TableCell>

                                <TableCell className="align-middle h-16">
                                    <Badge variant={getStatusVariant("some")} className="transition-smooth hover-lift">
                                        {order.status_name}
                                    </Badge>
                                </TableCell>

                                <TableCell className="align-middle h-16">
                                    <div className="flex flex-col">
                                        <span className={cn("text-sm font-medium", isOverdue(order.deadline) ? "text-red-600" : "text-foreground")}>
                                            {new Date(order.deadline).toLocaleDateString()}
                                        </span>
                                        <span className={cn("text-xs", isOverdue(order.deadline) ? "text-red-500" : "text-muted-foreground")}>
                                            {new Date(order.deadline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    </div>
                                </TableCell>

                                <TableCell className="align-middle h-16">
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "capitalize font-medium",
                                            order.priority === "low" && "border-green-500 text-green-500",
                                            order.priority === "medium" && "border-yellow-500 text-yellow-500",
                                            order.priority === "high" && "border-orange-500 text-orange-500",
                                            order.priority === "critical" && "border-red-600 text-red-600 bg-red-500/10"
                                        )}
                                    >
                                        {order.priority === "critical" && <span className="mr-1">⚠️</span>}
                                        {order.priority}
                                    </Badge>
                                </TableCell>

                                <TableCell className="align-middle h-16 pr-6">
                                    <div className="flex items-center justify-end gap-2">
                                        {order.status_id === 9 && (
                                            <>
                                                <Button size="sm" variant="outline" onClick={() => downloadOrderSourceFiles(order.id)} className="h-8">
                                                    Original
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => downloadOrderTargetFiles(order.id)} className="h-8">
                                                    Translation
                                                </Button>
                                                <Button size="sm" variant="default" onClick={() => confirmOrder(order.id)} className="h-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary">
                                                    Send
                                                </Button>
                                            </>
                                        )}

                                        {onEdit && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreHorizontal className="h-4 w-4"/>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => onEdit(order)}>
                                                        <Pencil className="h-4 w-4 mr-2"/> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => onDelete(order.id)} className="text-destructive">
                                                        <Trash2 className="h-4 w-4 mr-2"/> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}

                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleToggle(order.id)}
                                            className={cn(
                                                "rounded-full w-8 h-8 p-0 transition-transform duration-300",
                                                expandedId === order.id && "bg-muted"
                                            )}
                                        >
                                            <ChevronDown className={cn(
                                                "h-4 w-4 transition-transform duration-300",
                                                expandedId === order.id && "rotate-180"
                                            )}/>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>

                            {/* EXPANDED ROW */}
                            {expandedId === order.id && (
                                <TableRow className="bg-muted/10 border-b-0">
                                    <TableCell colSpan={7} className="p-0 border-b-0 relative">
                                        {/* Сучасна анімація появи (slide-in згори + fade-in) */}
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300 ease-out w-full">
                                            <div className="px-6 py-6 w-full">
                                                {loadingId === order.id ? (
                                                    <div className="flex items-center justify-center gap-3 py-8 animate-in fade-in">
                                                        <div className="loading-spinner"/>
                                                        <p className="text-sm text-muted-foreground">Loading details...</p>
                                                    </div>
                                                ) : (
                                                    details && (
                                                        <div className="space-y-6 w-full">

                                                            {/* КАРТКИ УЧАСНИКІВ: Клієнт та Перекладач */}
                                                            <div className="grid grid-cols-2 gap-4 w-full animate-stagger">
                                                                {(() => {
                                                                    // Шукаємо клієнта з масиву
                                                                    const clientId = details.client_id || (order as any).client_id;
                                                                    const client = clients?.find(c => c.id === clientId);

                                                                    return (
                                                                        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-background border border-border shadow-sm hover-lift transition-smooth">
                                                                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Client Information</span>
                                                                            <span className="text-lg font-bold text-foreground">
                                                                                {client ? client.full_name : `Client #${clientId}`}
                                                                            </span>
                                                                            {client?.email && (
                                                                                <span className="text-sm text-muted-foreground">{client.email}</span>
                                                                            )}
                                                                            {(client as any)?.phone_number && (
                                                                                <span className="text-sm text-muted-foreground">{(client as any).phone_number}</span>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })()}

                                                                {(() => {
                                                                    // Шукаємо перекладача з кешу
                                                                    const translatorId = details.translator_id || order.translator_id;
                                                                    const translator = translatorsCache[translatorId];

                                                                    return (
                                                                        <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-background border border-border shadow-sm hover-lift transition-smooth">
                                                                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Translator Information</span>
                                                                            <span className="text-lg font-bold text-foreground">
                                                                                {translator ? translator.full_name : getTranslatorName(translatorId)}
                                                                            </span>
                                                                            {translator?.email && (
                                                                                <span className="text-sm text-muted-foreground">{translator.email}</span>
                                                                            )}
                                                                            {(translator as any)?.phone && (
                                                                                <span className="text-sm text-muted-foreground">{(translator as any).phone}</span>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>

                                                            {/* КАРТКИ СТАТИСТИКИ */}
                                                            <div className="grid grid-cols-4 gap-4 w-full animate-stagger">
                                                                <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-background border border-border shadow-sm hover-lift transition-smooth">
                                                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pages</span>
                                                                    <span className="text-xl font-bold text-foreground">{details.page_count}</span>
                                                                </div>
                                                                <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-background border border-border shadow-sm hover-lift transition-smooth">
                                                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Images</span>
                                                                    <span className="text-xl font-bold text-foreground">{details.images_count}</span>
                                                                </div>
                                                                <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-background border border-border shadow-sm hover-lift transition-smooth">
                                                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Chars (with spaces)</span>
                                                                    <span className="text-xl font-bold text-foreground">{details.chars_with_spaces}</span>
                                                                </div>
                                                                <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-background border border-border shadow-sm hover-lift transition-smooth">
                                                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Chars (no spaces)</span>
                                                                    <span className="text-xl font-bold text-foreground">{details.chars_no_spaces}</span>
                                                                </div>
                                                            </div>

                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </Fragment>
                    ))}
                </TableBody>
            </Table>
            <div className="flex items-center justify-center gap-2 py-4 border-t bg-muted/20">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
                    Previous
                </Button>
                <div className="flex items-center gap-1">
                    {Array.from({length: totalPages}).map((_, i) => {
                        const pageNumber = i + 1
                        return (
                            <Button key={pageNumber} size="sm" variant={page === pageNumber ? "default" : "outline"} onClick={() => onPageChange(pageNumber)} className="w-9">
                                {pageNumber}
                            </Button>
                        )
                    })}
                </div>
                <Button variant="outline" size="sm" disabled={page === totalPages || totalPages === 0} onClick={() => onPageChange(page + 1)}>
                    Next
                </Button>
            </div>
        </div>
    )
}