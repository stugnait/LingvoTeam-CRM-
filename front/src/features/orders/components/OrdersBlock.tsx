"use client"

import { Fragment, useEffect, useState, useRef } from "react"
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
import { Input } from "@/src/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select"
import {
    MoreHorizontal,
    Pencil,
    Trash2,
    ChevronDown,
    CalendarIcon,
    Loader2,
    Search
} from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"

import { Calendar } from "@/src/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/src/components/ui/popover"

import type {
    OrderListItem,
    LanguagePair,
    Translator,
    Details,
    Client
} from "@/src/features/orders/types"
import { cn } from "@/src/lib/utils"

// 👉 ЗАБРАНО 12, 13, 14 із загального масиву статусів
const STATUS_OPTIONS = [
    { value: "5", label: "Planned", color: "bg-purple-500" },
    { value: "6", label: "To Do", color: "bg-blue-500" },
    { value: "1", label: "In Translation", color: "bg-amber-500" },
    { value: "7", label: "In Progress", color: "bg-yellow-500" },
    { value: "10", label: "Translated", color: "bg-cyan-500" },
    { value: "8", label: "In Checking", color: "bg-indigo-500" },
    { value: "11", label: "Revision", color: "bg-rose-500" },
    { value: "3", label: "Rejected", color: "bg-red-500" },
    { value: "9", label: "Checked", color: "bg-teal-500" },
    { value: "4", label: "Paused", color: "bg-slate-500" },
    { value: "2", label: "Done", color: "bg-emerald-500" },
];

// 👉 ДОДАНО опції виключно для фінансової колонки (client_status)
const PAYMENT_STATUS_OPTIONS = [
    { value: "14", label: "Unpaid", color: "bg-slate-400" },
    { value: "13", label: "Deposit", color: "bg-amber-500" },
    { value: "12", label: "Paid", color: "bg-emerald-500" }
];

interface OrdersTableProps {
    orders: any[]
    page: number
    totalPages: number
    onPageChange: (page: number) => void

    isOnlyMineFilter: boolean
    onFilterChange: (onlyMine: boolean) => void

    statusFilter?: string | number
    onStatusChange?: (val: string | number) => void

    managerFilter?: string | number
    onManagerChange?: (val: string | number) => void

    dateFromFilter?: string
    onDateFromChange?: (val: string) => void

    dateToFilter?: string
    onDateToChange?: (val: string) => void

    searchFilter?: string
    onSearchChange?: (val: string) => void

    managers?: any[]

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

    updateOrder: (orderId: number, data: any) => Promise<void>
    updateLoading?: number | null

    // 👉 ДОДАНО: функції для колонки Payment
    updateClientStatus: (orderId: number, statusId: number) => Promise<void>
    updateClientStatusLoading?: number | null
}

export function OrdersTable({
                                orders,
                                page,
                                totalPages,
                                onPageChange,
                                statusFilter,
                                onStatusChange,
                                managerFilter,
                                onManagerChange,
                                dateFromFilter,
                                onDateFromChange,
                                dateToFilter,
                                onDateToChange,
                                searchFilter,
                                onSearchChange,
                                managers = [],
                                onOpen,
                                languagePairs,
                                translatorsCache,
                                clients,
                                highlightId,
                                confirmOrder,
                                downloadOrderSourceFiles,
                                downloadOrderTargetFiles,
                                onEdit,
                                onDelete,
                                updateOrder,
                                updateLoading,
                                updateClientStatus,
                                updateClientStatusLoading
                            }: OrdersTableProps) {
    const [expandedId, setExpandedId] = useState<number | null>(null)
    const [details, setDetails] = useState<Details | null>(null)
    const [loadingId, setLoadingId] = useState<number | null>(null)
    const [activeHighlightId, setActiveHighlightId] = useState<number | null>(null)

    const [isFromCalendarOpen, setIsFromCalendarOpen] = useState(false)
    const [isToCalendarOpen, setIsToCalendarOpen] = useState(false)

    const [localSearch, setLocalSearch] = useState(searchFilter || "")
    const typingTimer = useRef<NodeJS.Timeout | null>(null)

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
        if (!highlightId) { return }
        setActiveHighlightId(highlightId)
        const timer = setTimeout(() => setActiveHighlightId(null), 5000)
        return () => clearTimeout(timer)
    }, [highlightId])

    useEffect(() => {
        setExpandedId(null)
        setDetails(null)
    }, [page])

    const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setLocalSearch(val)

        if (typingTimer.current) clearTimeout(typingTimer.current)
        typingTimer.current = setTimeout(() => {
            if (onSearchChange) onSearchChange(val)
        }, 500)
    }

    const isOverdue = (deadline: string) => new Date(deadline).getTime() < Date.now()

    const getTranslatorName = (translatorId: number | null) => {
        if (!translatorId) { return "—" }
        const translator = translatorsCache[translatorId]
        return translator?.full_name || `Translator #${translatorId}`
    }

    const formatToYMD = (date: Date) => {
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0]
    }

    const handleInlineStatusChange = async (orderId: number, statusId: string) => {
        await updateOrder(orderId, { status_id: Number(statusId) })
    }

    const handleInlinePaymentChange = async (orderId: number, paymentStatusId: string) => {
        await updateClientStatus(orderId, Number(paymentStatusId))
    }

    return (
        <div className="border border-border rounded-lg bg-card mx-2 sm:mx-4 my-6 shadow-soft relative z-10">

            {/* ПАНЕЛЬ ФІЛЬТРІВ */}
            <div className="flex flex-col xl:flex-row items-center justify-between p-3 sm:p-4 border-b border-border bg-muted/10 gap-3 sm:gap-4">
                <div className="flex flex-col items-center lg:flex-row gap-3 sm:gap-4 w-full xl:w-auto flex-wrap">

                    {/* Поле Пошуку */}
                    <div className="relative w-full lg:w-[250px] group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Пошук (ID, Коментар)..."
                            className="pl-9 bg-background focus-visible:ring-primary h-10 w-full"
                            value={localSearch}
                            onChange={handleSearchInput}
                        />
                    </div>

                    {/* Статус Фільтр */}
                    <Select
                        value={String(statusFilter || "all")}
                        onValueChange={(val) => onStatusChange && onStatusChange(val === "all" ? "" : val)}
                    >
                        <SelectTrigger className="w-full lg:w-[170px] bg-background h-10">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent className="z-[101]">
                            <SelectItem value="all">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-border" />
                                    <span>All Statuses</span>
                                </div>
                            </SelectItem>
                            {STATUS_OPTIONS.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-2 h-2 rounded-full", status.color)} />
                                        <span>{status.label}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Менеджер */}
                    <Select
                        value={String(managerFilter || "all")}
                        onValueChange={(val) => onManagerChange && onManagerChange(val === "all" ? "" : val)}
                    >
                        <SelectTrigger className="w-full lg:w-[180px] bg-background h-10">
                            <SelectValue placeholder="All Managers" />
                        </SelectTrigger>
                        <SelectContent className="z-[101]">
                            <SelectItem value="all">All Managers</SelectItem>
                            {managers.map(manager => (
                                <SelectItem key={manager.id} value={String(manager.id)}>
                                    {manager.full_name || manager.email}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Дати */}
                    <div className="flex flex-col lg:flex-row items-center gap-2 w-full xl:w-auto">

                        {/* Дата Від */}
                        <div className="relative w-full lg:w-auto group">
                            <Popover open={isFromCalendarOpen} onOpenChange={setIsFromCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className={cn(
                                            "flex h-10 w-full lg:w-[170px] items-center justify-between rounded-xl border border-border/50 bg-background/50 px-4 py-2 text-sm font-normal",
                                            "backdrop-blur-sm transition-all duration-300",
                                            "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring",
                                            "hover:bg-accent/10 hover:border-accent/30 shadow-sm hover:shadow-md"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <CalendarIcon className="h-4 w-4 opacity-50" />
                                            <span className={cn("truncate", dateFromFilter ? "text-black dark:text-white" : "text-muted-foreground/70")}>
                                                {dateFromFilter ? new Date(dateFromFilter).toLocaleDateString() : "Date From"}
                                            </span>
                                        </div>
                                        <ChevronDown className="h-4 w-4 shrink-0 opacity-50 transition-all duration-300 group-hover:opacity-70 group-hover:scale-110" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 z-[150] rounded-2xl shadow-2xl border-border bg-white" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dateFromFilter ? new Date(dateFromFilter) : undefined}
                                        onSelect={(date) => {
                                            if (onDateFromChange) {
                                                onDateFromChange(date ? formatToYMD(date) : "")
                                            }
                                            setIsFromCalendarOpen(false)
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <span className="text-muted-foreground hidden lg:inline-block">-</span>

                        {/* Дата До */}
                        <div className="relative w-full lg:w-auto group">
                            <Popover open={isToCalendarOpen} onOpenChange={setIsToCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className={cn(
                                            "flex h-10 w-full lg:w-[170px] items-center justify-between rounded-xl border border-border/50 bg-background/50 px-4 py-2 text-sm font-normal",
                                            "backdrop-blur-sm transition-all duration-300",
                                            "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring",
                                            "hover:bg-accent/10 hover:border-accent/30 shadow-sm hover:shadow-md"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <CalendarIcon className="h-4 w-4 opacity-50" />
                                            <span className={cn("truncate", dateToFilter ? "text-black dark:text-white" : "text-muted-foreground/70")}>
                                                {dateToFilter ? new Date(dateToFilter).toLocaleDateString() : "Date To"}
                                            </span>
                                        </div>
                                        <ChevronDown className="h-4 w-4 shrink-0 opacity-50 transition-all duration-300 group-hover:opacity-70 group-hover:scale-110" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 z-[150] rounded-2xl shadow-2xl border-border bg-white" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dateToFilter ? new Date(dateToFilter) : undefined}
                                        onSelect={(date) => {
                                            if (onDateToChange) {
                                                onDateToChange(date ? formatToYMD(date) : "")
                                            }
                                            setIsToCalendarOpen(false)
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden md:block">
                <Table className="w-full">
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="font-semibold text-foreground h-14 pl-6">ID</TableHead>
                            <TableHead className="font-semibold text-foreground h-14">Managers</TableHead>
                            <TableHead className="font-semibold text-foreground h-14">Languages</TableHead>
                            <TableHead className="font-semibold text-foreground h-14">Status</TableHead>
                            <TableHead className="font-semibold text-foreground h-14">Payment</TableHead>
                            <TableHead className="font-semibold text-foreground h-14">Deadline</TableHead>
                            <TableHead className="font-semibold text-foreground h-14">Priority</TableHead>
                            <TableHead className="font-semibold text-foreground h-14 pr-6 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                    No orders found.
                                </TableCell>
                            </TableRow>
                        ) : orders.map((order: any) => (
                            <Fragment key={order.id}>
                                <TableRow
                                    className={cn(
                                        "transition-colors hover:bg-muted/30",
                                        order.id === activeHighlightId && "bg-primary/10 ring-2 ring-primary",
                                        isOverdue(order.deadline) && "bg-red-500/10 hover:bg-red-500/15"
                                    )}
                                >
                                    <TableCell className="align-middle py-3 pl-6">
                                        <div className="font-medium text-foreground">#{order.id}</div>
                                    </TableCell>

                                    <TableCell className="align-middle py-3">
                                        <div className="flex flex-col gap-2.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 shrink-0 rounded-full bg-blue-500/10 flex items-center justify-center text-xs font-bold text-blue-600 border border-blue-500/20">
                                                    {order.manager_accept_name?.[0]?.toUpperCase() || "?"}
                                                </div>
                                                <div className="leading-tight">
                                                    <p className="text-xs font-semibold text-foreground truncate max-w-[120px]" title={order.manager_accept_name}>
                                                        {order.manager_accept_name || "Unassigned"}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                                        Accept
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 shrink-0 rounded-full bg-emerald-500/10 flex items-center justify-center text-xs font-bold text-emerald-600 border border-emerald-500/20">
                                                    {order.manager_delivery_name?.[0]?.toUpperCase() || "?"}
                                                </div>
                                                <div className="leading-tight">
                                                    <p className="text-xs font-semibold text-foreground truncate max-w-[120px]" title={order.manager_delivery_name}>
                                                        {order.manager_delivery_name || "Unassigned"}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                                        Delivery
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell className="align-middle py-3">
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

                                    <TableCell className="align-middle py-3">
                                        {updateLoading === order.id ? (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground">
                                                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                                <span>Saving...</span>
                                            </div>
                                        ) : (
                                            <Select
                                                value={String(order.status_id)}
                                                onValueChange={(val) => handleInlineStatusChange(order.id, val)}
                                            >
                                                <SelectTrigger className="h-8 w-[140px] text-xs font-semibold bg-background shadow-sm border-border">
                                                    <SelectValue placeholder={order.status_name} />
                                                </SelectTrigger>
                                                <SelectContent className="z-[102]">
                                                    {STATUS_OPTIONS.map((status) => (
                                                        <SelectItem key={status.value} value={status.value}>
                                                            <div className="flex items-center gap-2">
                                                                <div className={cn("w-2 h-2 rounded-full", status.color)} />
                                                                <span>{status.label}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </TableCell>

                                    <TableCell className="align-middle py-3">
                                        {updateClientStatusLoading === order.id ? (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground">
                                                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                                <span>Saving...</span>
                                            </div>
                                        ) : (
                                            <Select
                                                value={String(order.client_status || order.client_status_id || "5")} // Якщо немає, ставимо Unpaid(5)
                                                onValueChange={(val) => handleInlinePaymentChange(order.id, val)}
                                            >
                                                <SelectTrigger className="h-8 w-[110px] text-xs font-semibold bg-background shadow-sm border-border">
                                                    <SelectValue placeholder="Payment" />
                                                </SelectTrigger>
                                                <SelectContent className="z-[102]">
                                                    {PAYMENT_STATUS_OPTIONS.map((status) => (
                                                        <SelectItem key={status.value} value={status.value}>
                                                            <div className="flex items-center gap-2">
                                                                <div className={cn("w-2 h-2 rounded-full", status.color)} />
                                                                <span>{status.label}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </TableCell>

                                    <TableCell className="align-middle py-3">
                                        <div className="flex flex-col">
                                            <span className={cn("text-sm font-medium", isOverdue(order.deadline) ? "text-red-600" : "text-foreground")}>
                                                {new Date(order.deadline).toLocaleDateString()}
                                            </span>
                                            <span className={cn("text-xs", isOverdue(order.deadline) ? "text-red-500" : "text-muted-foreground")}>
                                                {new Date(order.deadline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                        </div>
                                    </TableCell>

                                    <TableCell className="align-middle py-3">
                                        <Badge variant="outline">{order.priority}</Badge>
                                    </TableCell>

                                    <TableCell className="align-middle py-3 pr-6">
                                        <div className="flex items-center justify-end gap-2">
                                            {order.status_id === 9 && (
                                                <>
                                                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); downloadOrderSourceFiles(order.id); }} className="h-8">Original</Button>
                                                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); downloadOrderTargetFiles(order.id); }} className="h-8">Translation</Button>
                                                    <Button size="sm" variant="default" onClick={(e) => { e.stopPropagation(); confirmOrder(order.id); }} className="h-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary">Send</Button>
                                                </>
                                            )}

                                            {/* 👉 ЗАБРАНО блок з кнопками оплати, який був тут */}

                                            {onEdit && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="z-[101]">
                                                        <DropdownMenuItem onClick={() => onEdit(order as any)}>
                                                            <Pencil className="h-4 w-4 mr-2" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => onDelete(order.id)} className="text-destructive">
                                                            <Trash2 className="h-4 w-4 mr-2" /> Delete
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
                                                )} />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>

                                {/* EXPANDED ROW */}
                                {expandedId === order.id && (
                                    <TableRow className="bg-muted/10 border-b-0">
                                        <TableCell colSpan={8} className="p-0 border-b-0 relative">
                                            <div className="animate-in fade-in slide-in-from-top-2 duration-300 ease-out w-full">
                                                <div className="px-6 py-6 w-full">

                                                    {loadingId === order.id ? (
                                                        <div className="flex items-center justify-center gap-3 py-8 animate-in fade-in">
                                                            <div className="loading-spinner" />
                                                            <p className="text-sm text-muted-foreground">Loading details...</p>
                                                        </div>
                                                    ) : details && (
                                                        <div className="space-y-6 w-full">
                                                            <div className="grid grid-cols-2 gap-4 w-full animate-stagger">
                                                                {(() => {
                                                                    const clientId = details.client?.id || order.client_id
                                                                    const client = details.client || clients?.find(c => c.id === clientId)

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
                                                                    )
                                                                })()}

                                                                {(() => {
                                                                    const translatorId = details.translator?.id || order.translator_id
                                                                    const translator = details.translator || translatorsCache[translatorId]

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
                                                                    )
                                                                })()}
                                                            </div>

                                                            <div className="grid grid-cols-4 gap-4 w-full animate-stagger">
                                                                <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-background border border-border shadow-sm hover-lift transition-smooth">
                                                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pages</span>
                                                                    <span className="text-xl font-bold text-foreground">{details.page_count}</span>
                                                                </div>
                                                                <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-background border border-border shadow-sm hover-lift transition-smooth">
                                                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Images</span>
                                                                    <span className="text-xl font-bold text-foreground">
                                                                        {details.images_count}
                                                                    </span>
                                                                </div>
                                                                <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-background border border-border shadow-sm hover-lift transition-smooth">
                                                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Chars (with spaces)</span>
                                                                    <span className="text-xl font-bold text-foreground">{details.symbols_with_spaces_count}</span>
                                                                </div>
                                                                <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-background border border-border shadow-sm hover-lift transition-smooth">
                                                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Chars (no spaces)</span>
                                                                    <span className="text-xl font-bold text-foreground">{details.symbols_count}</span>
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

            {/* MOBILE CARDS */}
            <div className="md:hidden divide-y divide-border">
                {orders.length === 0 ? (
                    <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
                        No orders found.
                    </div>
                ) : orders.map((order: any) => (
                    <Fragment key={order.id}>
                        <div className={cn(
                            "p-4 space-y-3",
                            order.id === activeHighlightId && "bg-primary/10",
                            isOverdue(order.deadline) && "bg-red-500/10"
                        )}>
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                    <span className="font-bold text-foreground">#{order.id}</span>

                                    {/* 👉 Загальний Статус (Мобілка) */}
                                    {updateLoading === order.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                    ) : (
                                        <Select
                                            value={String(order.status_id)}
                                            onValueChange={(val) => handleInlineStatusChange(order.id, val)}
                                        >
                                            <SelectTrigger className="h-7 w-[120px] text-[11px] font-semibold bg-background border-border py-0 px-2">
                                                <SelectValue placeholder={order.status_name} />
                                            </SelectTrigger>
                                            <SelectContent className="z-[102]">
                                                {STATUS_OPTIONS.map((status) => (
                                                    <SelectItem key={status.value} value={status.value}>
                                                        <div className="flex items-center gap-1.5">
                                                            <div className={cn("w-1.5 h-1.5 rounded-full", status.color)} />
                                                            <span>{status.label}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}

                                    {/* 👉 ДОДАНО: Статус Оплати (Мобілка) */}
                                    {updateClientStatusLoading === order.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                    ) : (
                                        <Select
                                            value={String(order.client_status || order.client_status_id || "5")}
                                            onValueChange={(val) => handleInlinePaymentChange(order.id, val)}
                                        >
                                            <SelectTrigger className="h-7 w-[100px] text-[11px] font-semibold bg-background border-border py-0 px-2">
                                                <SelectValue placeholder="Payment" />
                                            </SelectTrigger>
                                            <SelectContent className="z-[102]">
                                                {PAYMENT_STATUS_OPTIONS.map((status) => (
                                                    <SelectItem key={status.value} value={status.value}>
                                                        <div className="flex items-center gap-1.5">
                                                            <div className={cn("w-1.5 h-1.5 rounded-full", status.color)} />
                                                            <span>{status.label}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}

                                    <Badge variant="outline" className="text-xs shrink-0">{order.priority}</Badge>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    {onEdit && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="z-[101]">
                                                <DropdownMenuItem onClick={() => onEdit(order as any)}>
                                                    <Pencil className="h-4 w-4 mr-2" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onDelete(order.id)} className="text-destructive">
                                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleToggle(order.id)}
                                        className={cn("rounded-full w-8 h-8 p-0", expandedId === order.id && "bg-muted")}
                                    >
                                        <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", expandedId === order.id && "rotate-180")} />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-foreground border border-border">
                                    {order.source_language}
                                </span>
                                <span className="text-muted-foreground text-xs">→</span>
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                                    {order.target_language}
                                </span>
                            </div>

                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1.5 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 shrink-0 rounded-full bg-blue-500/10 flex items-center justify-center text-[10px] font-bold text-blue-600 border border-blue-500/20">
                                            {order.manager_accept_name?.[0]?.toUpperCase() || "?"}
                                        </div>
                                        <span className="text-xs text-foreground truncate max-w-[130px]">
                                            {order.manager_accept_name || "Unassigned"}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">Accept</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 shrink-0 rounded-full bg-emerald-500/10 flex items-center justify-center text-[10px] font-bold text-emerald-600 border border-emerald-500/20">
                                            {order.manager_delivery_name?.[0]?.toUpperCase() || "?"}
                                        </div>
                                        <span className="text-xs text-foreground truncate max-w-[130px]">
                                            {order.manager_delivery_name || "Unassigned"}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">Delivery</span>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className={cn("text-sm font-medium", isOverdue(order.deadline) ? "text-red-600" : "text-foreground")}>
                                        {new Date(order.deadline).toLocaleDateString()}
                                    </p>
                                    <p className={cn("text-xs", isOverdue(order.deadline) ? "text-red-500" : "text-muted-foreground")}>
                                        {new Date(order.deadline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                </div>
                            </div>

                            {order.status_id === 9 && (
                                <div className="flex gap-2 pt-1">
                                    <Button size="sm" variant="outline" className="h-8 flex-1 text-xs"
                                            onClick={(e) => { e.stopPropagation(); downloadOrderSourceFiles(order.id); }}>
                                        Original
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-8 flex-1 text-xs"
                                            onClick={(e) => { e.stopPropagation(); downloadOrderTargetFiles(order.id); }}>
                                        Translation
                                    </Button>
                                    <Button size="sm" variant="default" className="h-8 flex-1 text-xs bg-gradient-to-r from-primary to-primary/80"
                                            onClick={(e) => { e.stopPropagation(); confirmOrder(order.id); }}>
                                        Send
                                    </Button>
                                </div>
                            )}

                            {expandedId === order.id && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300 pt-2 space-y-3">
                                    {loadingId === order.id ? (
                                        <div className="flex items-center justify-center gap-2 py-4">
                                            <div className="loading-spinner" />
                                            <p className="text-sm text-muted-foreground">Loading details...</p>
                                        </div>
                                    ) : details && (
                                        <>
                                            <div className="grid grid-cols-1 gap-3">
                                                {(() => {
                                                    const clientId = details.client?.id || order.client_id
                                                    const client = details.client || clients?.find(c => c.id === clientId)
                                                    return (
                                                        <div className="flex flex-col gap-1 p-3 rounded-lg bg-background border border-border shadow-sm">
                                                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Client Information</span>
                                                            <span className="text-sm font-bold text-foreground">{client ? client.full_name : `Client #${clientId}`}</span>
                                                            {client?.email && <span className="text-xs text-muted-foreground">{client.email}</span>}
                                                            {(client as any)?.phone_number && <span className="text-xs text-muted-foreground">{(client as any).phone_number}</span>}
                                                        </div>
                                                    )
                                                })()}
                                                {(() => {
                                                    const translatorId = details.translator?.id || order.translator_id
                                                    const translator = details.translator || translatorsCache[translatorId]
                                                    return (
                                                        <div className="flex flex-col gap-1 p-3 rounded-lg bg-background border border-border shadow-sm">
                                                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Translator Information</span>
                                                            <span className="text-sm font-bold text-foreground">{translator ? translator.full_name : getTranslatorName(translatorId)}</span>
                                                            {translator?.email && <span className="text-xs text-muted-foreground">{translator.email}</span>}
                                                            {(translator as any)?.phone && <span className="text-xs text-muted-foreground">{(translator as any).phone}</span>}
                                                        </div>
                                                    )
                                                })()}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-background border border-border shadow-sm">
                                                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Pages</span>
                                                    <span className="text-lg font-bold text-foreground">{details.page_count}</span>
                                                </div>
                                                <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-background border border-border shadow-sm">
                                                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Images</span>
                                                    <span className="text-lg font-bold text-foreground">{details.images_count}</span>
                                                </div>
                                                <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-background border border-border shadow-sm">
                                                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Chars (with spaces)</span>
                                                    <span className="text-lg font-bold text-foreground">{details.symbols_with_spaces_count}</span>
                                                </div>
                                                <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-background border border-border shadow-sm">
                                                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Chars (no spaces)</span>
                                                    <span className="text-lg font-bold text-foreground">{details.symbols_count}</span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </Fragment>
                ))}
            </div>

            <div className="flex items-center justify-center gap-2 py-4 border-t bg-muted/20">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
                    Previous
                </Button>
                <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => {
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