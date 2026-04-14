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
    Details
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
        if (!highlightId) return
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
        if (!translatorId) return "—"
        const translator = translatorsCache[translatorId]
        return translator?.full_name || `Translator #${translatorId}`
    }

    return (
        <div className="border border-border rounded-lg bg-card mx-4 my-6 shadow-soft overflow-hidden">

            {/* FILTER */}
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
                        <TableHead className="font-semibold text-foreground h-14">Manager</TableHead>
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

                                {/* ONLY MANAGER */}
                                <TableCell className="align-middle h-16">
                                    <div className="flex items-center gap-3">
                                        {order.manager_avatar ? (
                                            <img
                                                src={order.manager_avatar}
                                                alt="manager"
                                                className="w-9 h-9 rounded-full object-cover border"
                                            />
                                        ) : (
                                            <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center text-sm font-semibold text-blue-600">
                                                {order.manager_name?.[0] || "M"}
                                            </div>
                                        )}
                                        <div className="leading-tight">
                                            <p className="text-sm font-medium text-foreground">
                                                {order.manager_name || "Manager"}
                                            </p>
                                            <p className="text-xs text-blue-600 font-medium">
                                                Manager
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>

                                {/* LANGUAGES залишив як є */}
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
                                    <Badge variant="outline">{order.priority}</Badge>
                                </TableCell>

                                <TableCell className="align-middle h-16 pr-6">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleToggle(order.id)}
                                    >
                                        <ChevronDown className={cn(
                                            "h-4 w-4 transition-transform duration-300",
                                            expandedId === order.id && "rotate-180"
                                        )}/>
                                    </Button>
                                </TableCell>
                            </TableRow>

                            {/* EXPANDED */}
                            {expandedId === order.id && (
                                <TableRow className="bg-muted/10 border-b-0">
                                    <TableCell colSpan={7} className="p-0 border-b-0 relative">
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300 ease-out w-full">
                                            <div className="px-6 py-6 w-full">

                                                {details && (
                                                    <div className="space-y-6 w-full">

                                                        {/* NEW: CLIENT + TRANSLATOR */}
                                                        <div className="flex items-center gap-8">

                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                                                                    {order.client_name?.[0] || "C"}
                                                                </div>
                                                                <div className="leading-tight">
                                                                    <p className="text-sm font-semibold text-foreground">
                                                                        {order.client_name || "Unknown client"}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {order.client_email || "—"}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Client
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center text-sm font-semibold text-green-600">
                                                                    {getTranslatorName(order.translator_id)?.[0] || "T"}
                                                                </div>
                                                                <div className="leading-tight">
                                                                    <p className="text-sm font-medium text-foreground">
                                                                        {getTranslatorName(order.translator_id)}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {translatorsCache[order.translator_id]?.email || "—"}
                                                                    </p>
                                                                    <p className="text-xs text-green-600 font-medium">
                                                                        Translator
                                                                    </p>
                                                                </div>
                                                            </div>

                                                        </div>

                                                        {/* ORIGINAL DETAILS (НЕ ЧІПАВ) */}
                                                        <div className="grid grid-cols-2 gap-4 w-full animate-stagger">
                                                            <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-background border border-border shadow-sm hover-lift transition-smooth">
                                                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pages</span>
                                                                <span className="text-xl font-bold text-foreground">{details.page_count}</span>
                                                            </div>
                                                            <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-background border border-border shadow-sm hover-lift transition-smooth">
                                                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Symbols</span>
                                                                <span className="text-xl font-bold text-foreground">{details.symbols_count}</span>
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
        </div>
    )
}