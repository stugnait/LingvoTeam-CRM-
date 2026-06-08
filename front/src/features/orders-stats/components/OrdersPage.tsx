"use client"

import { Fragment, useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/src/lib/utils"
import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"
import { Button } from "@/src/components/ui/button"
import { Calendar } from "@/src/components/ui/calendar"
import { Input } from "@/src/components/ui/input"
import {
    Popover, PopoverContent, PopoverTrigger,
} from "@/src/components/ui/popover"
import {
    Table, TableBody, TableCell,
    TableHead, TableHeader, TableRow,
} from "@/src/components/ui/table"
import {
    CalendarIcon, X, Search, TrendingUp,
    FileText, Type, Hash, Wallet,
    AlertCircle, ChevronDown, ExternalLink,
    User, UserCheck, BookOpen, Languages,
    Tag, MessageSquare,
} from "lucide-react"
import type { DateRange } from "react-day-picker"

import { useOrders } from "../hooks/useOrders"
import type { OrdersParams, OrderItem } from "../types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatYMD(d: Date) { return d.toISOString().split("T")[0] }

function formatDisplayDate(d: Date) {
    return new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "short", year: "numeric" }).format(d)
}

function formatCurrency(val: number | string) {
    return `${Number(val || 0).toLocaleString("uk-UA", { maximumFractionDigits: 0 })} грн`
}

function formatDate(val: string | null) {
    if (!val) return "—"
    return new Intl.DateTimeFormat("uk-UA", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(val))
}

function formatDateTime(val: string | null) {
    if (!val) return "—"
    return new Intl.DateTimeFormat("uk-UA", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    }).format(new Date(val))
}

function isOverdue(deadline: string | null, statusId?: number) {
    if (!deadline) return false
    if (statusId && [2, 3, 9].includes(statusId)) return false
    return new Date(deadline) < new Date()
}

const STATUS_NAMES: Record<number, string> = {
    1: "In Translation", 2: "Done", 3: "Rejected", 4: "Paused",
    5: "Planned", 6: "To Do", 7: "In Progress", 8: "In Checking",
    9: "Checked", 10: "Translated", 11: "Revision",
}

const STATUS_COLORS: Record<number, string> = {
    1:  "bg-amber-50 text-amber-700 border-amber-100",
    2:  "bg-emerald-50 text-emerald-700 border-emerald-100",
    3:  "bg-red-50 text-red-600 border-red-100",
    4:  "bg-slate-100 text-slate-500 border-slate-200",
    5:  "bg-purple-50 text-purple-700 border-purple-100",
    6:  "bg-blue-50 text-blue-700 border-blue-100",
    7:  "bg-yellow-50 text-yellow-700 border-yellow-100",
    8:  "bg-indigo-50 text-indigo-700 border-indigo-100",
    9:  "bg-teal-50 text-teal-700 border-teal-100",
    10: "bg-cyan-50 text-cyan-700 border-cyan-100",
    11: "bg-rose-50 text-rose-600 border-rose-100",
}

// ─── Клікабельний міні-бейдж людини (для основного рядка) ─────────────────────

function PersonChip({
                        person,
                        role,
                        label,
                        avatarColor,
                    }: {
    person?: { id: number; full_name: string } | null
    role: "manager" | "editor" | "translator"
    label: string
    avatarColor: string
}) {
    const router = useRouter()
    if (!person) return (
        <div className="flex items-center gap-1.5">
            <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border bg-slate-100 text-slate-400 border-slate-200")}>
                ?
            </span>
            <div className="leading-none">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</p>
                <p className="text-xs text-slate-400 italic">—</p>
            </div>
        </div>
    )

    const routeMap = {
        manager:    `/dashboard/manager-stats/${person.id}`,
        editor:     `/dashboard/editor-stats/${person.id}`,
        translator: `/dashboard/translators-stats/${person.id}`,
    }

    return (
        <button
            onClick={(e) => { e.stopPropagation(); router.push(routeMap[role]) }}
            className="flex items-center gap-1.5 group hover:opacity-80 transition-opacity"
        >
            <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border shrink-0", avatarColor)}>
                {person.full_name?.[0]?.toUpperCase()}
            </span>
            <div className="leading-none text-left">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</p>
                <p className="text-xs font-medium text-slate-700 group-hover:text-indigo-600 transition-colors max-w-[90px] truncate">
                    {person.full_name}
                </p>
            </div>
            <ExternalLink className="w-2.5 h-2.5 text-slate-300 group-hover:text-indigo-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
    )
}

// ─── Клікабельна картка людини (для expanded) ────────────────────────────────

function PersonCard({
                        person,
                        role,
                        label,
                        icon: Icon,
                        bgColor,
                        textColor,
                        borderColor,
                    }: {
    person?: { id: number; full_name: string; email?: string } | null
    role: "manager" | "editor" | "translator"
    label: string
    icon: any
    bgColor: string
    textColor: string
    borderColor: string
}) {
    const router = useRouter()

    const routeMap = {
        manager:    `/dashboard/manager-stats/${person?.id}`,
        editor:     `/dashboard/editor-stats/${person?.id}`,
        translator: `/dashboard/translators-stats/${person?.id}`,
    }

    if (!person) return (
        <div className={cn("flex flex-col gap-1.5 p-3 rounded-xl border bg-slate-50 border-slate-100")}>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Icon className="w-3 h-3" /> {label}
            </span>
            <span className="text-sm text-slate-400 italic">Не призначено</span>
        </div>
    )

    return (
        <button
            onClick={(e) => { e.stopPropagation(); router.push(routeMap[role]) }}
            className={cn(
                "flex flex-col gap-1.5 p-3 rounded-xl border text-left transition-all hover:shadow-sm hover:-translate-y-0.5",
                bgColor, borderColor
            )}
        >
            <span className={cn("text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1", textColor)}>
                <Icon className="w-3 h-3" /> {label}
            </span>
            <div className="flex items-center justify-between gap-2">
                <div>
                    <p className="text-sm font-bold text-slate-900">{person.full_name}</p>
                    {person.email && <p className="text-xs text-slate-500 mt-0.5">{person.email}</p>}
                </div>
                <ExternalLink className={cn("w-3.5 h-3.5 shrink-0", textColor)} />
            </div>
        </button>
    )
}

// ─── Expanded Row ─────────────────────────────────────────────────────────────

function ExpandedRow({ order }: { order: OrderItem }) {
    return (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200 px-6 py-5 bg-gradient-to-b from-slate-50/80 to-white border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">

                {/* Менеджер прийому */}
                <PersonCard
                    person={order.manager_accept}
                    role="manager"
                    label="Менеджер прийому"
                    icon={UserCheck}
                    bgColor="bg-violet-50"
                    textColor="text-violet-600"
                    borderColor="border-violet-100"
                />

                {/* Менеджер здачі */}
                <PersonCard
                    person={order.manager_delivery}
                    role="manager"
                    label="Менеджер здачі"
                    icon={UserCheck}
                    bgColor="bg-violet-50"
                    textColor="text-violet-600"
                    borderColor="border-violet-100"
                />

                {/* Редактор */}
                <PersonCard
                    person={order.editor}
                    role="editor"
                    label="Редактор"
                    icon={BookOpen}
                    bgColor="bg-blue-50"
                    textColor="text-blue-600"
                    borderColor="border-blue-100"
                />

                {/* Перекладач */}
                <PersonCard
                    person={order.translator ? { id: order.translator.id, full_name: order.translator.full_name, email: order.translator.email } : null}
                    role="translator"
                    label="Перекладач"
                    icon={Languages}
                    bgColor="bg-emerald-50"
                    textColor="text-emerald-600"
                    borderColor="border-emerald-100"
                />
            </div>

            {/* Статистика + деталі */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-3">

                <div className="flex flex-col gap-1 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Сторінки
                    </span>
                    <span className="text-xl font-bold text-slate-900">{order.page_count}</span>
                </div>

                <div className="flex flex-col gap-1 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Type className="w-3 h-3" /> Симв. з пр.
                    </span>
                    <span className="text-xl font-bold text-slate-900">{(order.symbols_with_spaces_count || 0).toLocaleString("uk-UA")}</span>
                </div>

                <div className="flex flex-col gap-1 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Hash className="w-3 h-3" /> Симв. без пр.
                    </span>
                    <span className="text-xl font-bold text-slate-900">{(order.symbols_count || 0).toLocaleString("uk-UA")}</span>
                </div>

                <div className="flex flex-col gap-1 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Wallet className="w-3 h-3" /> Сума
                    </span>
                    <span className="text-xl font-bold text-emerald-600">{formatCurrency(order.total_amount)}</span>
                </div>

                <div className="flex flex-col gap-1 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Languages className="w-3 h-3" /> Мовна пара
                    </span>
                    <span className="text-sm font-semibold text-slate-700">{order.language_pair?.name || "—"}</span>
                </div>

                <div className="flex flex-col gap-1 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Tag className="w-3 h-3" /> Тариф
                    </span>
                    <span className="text-sm font-semibold text-slate-700">{order.tariff_name || "—"}</span>
                </div>
            </div>

            {/* Коментар */}
            {order.client_comment && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <MessageSquare className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-0.5">Коментар клієнта</p>
                        <p className="text-sm text-slate-700">{order.client_comment}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Головний компонент ───────────────────────────────────────────────────────

export function OrdersPage() {
    const [range, setRange]             = useState<DateRange | undefined>(undefined)
    const [calOpen, setCalOpen]         = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [expandedId, setExpandedId]   = useState<number | null>(null)
    const typingTimer                   = useRef<NodeJS.Timeout | null>(null)

    const { data, loading, fetchOrders } = useOrders()

    const buildParams = (search: string, r: DateRange | undefined): OrdersParams => {
        const p: OrdersParams = {}
        if (search.trim())    p.search     = search.trim()
        if (r?.from && r?.to) {
            p.start_date = formatYMD(r.from)
            p.end_date   = formatYMD(r.to)
        }
        return p
    }

    useEffect(() => {
        fetchOrders(buildParams(searchQuery, range))
    }, [range])

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setSearchQuery(val)
        if (typingTimer.current) clearTimeout(typingTimer.current)
        typingTimer.current = setTimeout(() => {
            fetchOrders(buildParams(val, range))
        }, 500)
    }

    const handleRowClick = (id: number) => {
        setExpandedId(prev => prev === id ? null : id)
    }

    // ── KPI ───────────────────────────────────────────────────────────────────
    const totalRevenue        = data.reduce((a, o) => a + Number(o.total_amount || 0), 0)
    const totalPages          = data.reduce((a, o) => a + (o.page_count || 0), 0)
    const totalSymbolsWith    = data.reduce((a, o) => a + (o.symbols_with_spaces_count || 0), 0)
    const totalSymbolsWithout = data.reduce((a, o) => a + (o.symbols_count || 0), 0)

    const displayLabel =
        range?.from && range?.to
            ? `${formatDisplayDate(range.from)} – ${formatDisplayDate(range.to)}`
            : range?.from ? `${formatDisplayDate(range.from)} – ...` : "Оберіть період"

    return (
        <>
            <DashboardHeader />
            <div className="flex flex-col min-h-screen bg-[#F8FAFC] p-4 sm:p-8">

                {/* ─── Заголовок ──────────────────────────────────────── */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Замовлення</h1>
                    <p className="text-slate-500 text-sm mt-1">Повний перелік замовлень з деталями по кожному</p>
                </div>

                {/* ─── KPI Картки ─────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500">
                                <Wallet className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Загальна сума</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</p>
                        <p className="text-xs text-slate-400 mt-1">{data.length} замовлень</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                                <FileText className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Сторінок</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{totalPages.toLocaleString("uk-UA")}</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-500">
                                <Type className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Символи з пробілом</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{totalSymbolsWith.toLocaleString("uk-UA")}</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                                <Hash className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Символи без пробілу</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{totalSymbolsWithout.toLocaleString("uk-UA")}</p>
                    </div>
                </div>

                {/* ─── Фільтри ─────────────────────────────────────────── */}
                <div className="bg-white p-4 rounded-t-2xl border border-slate-100 border-b-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative w-full sm:w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Пошук по ID або коментарю..."
                            className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-indigo-500"
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                    </div>

                    <Popover open={calOpen} onOpenChange={setCalOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full sm:w-[260px] justify-start gap-2 bg-white font-normal border-slate-200 shadow-sm text-sm", !range && "text-slate-500")}>
                                <CalendarIcon className="w-4 h-4 shrink-0 text-slate-500" />
                                {displayLabel}
                                {range && (
                                    <div role="button" onClick={(e) => { e.stopPropagation(); setRange(undefined) }} className="ml-auto hover:bg-slate-100 p-1 rounded-full">
                                        <X className="w-3 h-3 text-slate-400" />
                                    </div>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar mode="range" selected={range}
                                      onSelect={(val) => { setRange(val); if (val?.from && val?.to) setCalOpen(false) }}
                                      numberOfMonths={2} disabled={{ after: new Date() }} />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* ─── Таблиця ─────────────────────────────────────────── */}
                <div className="bg-white rounded-b-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/80">
                                <TableRow className="hover:bg-transparent border-b border-slate-100">
                                    <TableHead className="h-11 pl-6 font-semibold text-slate-600 text-xs uppercase tracking-wider w-[80px]">№</TableHead>
                                    <TableHead className="h-11 font-semibold text-slate-600 text-xs uppercase tracking-wider">Дата прийому</TableHead>
                                    <TableHead className="h-11 font-semibold text-slate-600 text-xs uppercase tracking-wider">Дата здачі</TableHead>
                                    <TableHead className="h-11 font-semibold text-slate-600 text-xs uppercase tracking-wider">Клієнт</TableHead>
                                    <TableHead className="h-11 font-semibold text-slate-600 text-xs uppercase tracking-wider">Люди</TableHead>
                                    <TableHead className="h-11 font-semibold text-slate-600 text-xs uppercase tracking-wider text-right">Стор.</TableHead>
                                    <TableHead className="h-11 font-semibold text-slate-600 text-xs uppercase tracking-wider text-right">Сума</TableHead>
                                    <TableHead className="h-11 font-semibold text-slate-600 text-xs uppercase tracking-wider text-center w-[130px]">Статус</TableHead>
                                    <TableHead className="h-11 w-[40px]" />
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-32 text-center text-slate-400">
                                            Завантаження замовлень...
                                        </TableCell>
                                    </TableRow>
                                ) : data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-32 text-center text-slate-400">
                                            Замовлення відсутні за вибраний період
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.map((order) => {
                                        const overdue    = isOverdue(order.deadline, order.status_id)
                                        const statusName = STATUS_NAMES[order.status_id] ?? `#${order.status_id}`
                                        const statusCls  = STATUS_COLORS[order.status_id] ?? "bg-slate-100 text-slate-500 border-slate-200"
                                        const isExpanded = expandedId === order.id

                                        return (
                                            <Fragment key={order.id}>
                                                <TableRow
                                                    onClick={() => handleRowClick(order.id)}
                                                    className={cn(
                                                        "cursor-pointer transition-colors border-b border-slate-50 last:border-0",
                                                        isExpanded ? "bg-indigo-50/40 hover:bg-indigo-50/60" : "hover:bg-slate-50",
                                                        overdue && !isExpanded && "bg-red-50/30 hover:bg-red-50/50"
                                                    )}
                                                >
                                                    {/* 1. ID */}
                                                    <TableCell className="py-3.5 pl-6">
                                                        <span className="font-bold text-slate-900 text-sm">#{order.id}</span>
                                                    </TableCell>

                                                    {/* 2. Дата прийому */}
                                                    <TableCell className="py-3.5">
                                                        <span className="text-sm text-slate-600">{formatDate(order.created_at)}</span>
                                                    </TableCell>

                                                    {/* 3. Дата здачі */}
                                                    <TableCell className="py-3.5">
                                                        <div className="flex items-center gap-1.5">
                                                            {overdue && <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                                                            <span className={cn("text-sm", overdue ? "font-semibold text-red-600" : "text-slate-600")}>
                                                                {formatDate(order.deadline)}
                                                            </span>
                                                        </div>
                                                    </TableCell>

                                                    {/* 4. Клієнт */}
                                                    <TableCell className="py-3.5">
                                                        {order.client ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                                                                    {order.client.full_name?.[0]?.toUpperCase()}
                                                                </div>
                                                                <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">
                                                                    {order.client.full_name}
                                                                </span>
                                                            </div>
                                                        ) : <span className="text-slate-400 text-sm">—</span>}
                                                    </TableCell>

                                                    {/* 5. Люди (менеджери + редактор + перекладач) */}
                                                    <TableCell className="py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <PersonChip
                                                                person={order.manager_accept}
                                                                role="manager"
                                                                label="Accept"
                                                                avatarColor="bg-violet-100 text-violet-700 border-violet-200"
                                                            />
                                                            <PersonChip
                                                                person={order.manager_delivery}
                                                                role="manager"
                                                                label="Delivery"
                                                                avatarColor="bg-violet-100 text-violet-700 border-violet-200"
                                                            />
                                                            <PersonChip
                                                                person={order.editor}
                                                                role="editor"
                                                                label="Editor"
                                                                avatarColor="bg-blue-100 text-blue-700 border-blue-200"
                                                            />
                                                            <PersonChip
                                                                person={order.translator ? { id: order.translator.id, full_name: order.translator.full_name } : null}
                                                                role="translator"
                                                                label="Translator"
                                                                avatarColor="bg-emerald-100 text-emerald-700 border-emerald-200"
                                                            />
                                                        </div>
                                                    </TableCell>

                                                    {/* 6. Сторінки */}
                                                    <TableCell className="py-3.5 text-right">
                                                        <span className="text-sm font-semibold text-slate-700">{order.page_count}</span>
                                                    </TableCell>

                                                    {/* 7. Сума */}
                                                    <TableCell className="py-3.5 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                                            <span className="font-bold text-slate-900 text-sm whitespace-nowrap">
                                                                {formatCurrency(order.total_amount)}
                                                            </span>
                                                        </div>
                                                    </TableCell>

                                                    {/* 8. Статус */}
                                                    <TableCell className="py-3.5 text-center">
                                                        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border", statusCls)}>
                                                            {statusName}
                                                        </span>
                                                    </TableCell>

                                                    {/* 9. Expand toggle */}
                                                    <TableCell className="py-3.5 pr-4">
                                                        <ChevronDown className={cn(
                                                            "w-4 h-4 text-slate-400 transition-transform duration-200",
                                                            isExpanded && "rotate-180 text-indigo-500"
                                                        )} />
                                                    </TableCell>
                                                </TableRow>

                                                {/* Expanded Row */}
                                                {isExpanded && (
                                                    <TableRow className="border-b border-slate-100 hover:bg-transparent">
                                                        <TableCell colSpan={9} className="p-0">
                                                            <ExpandedRow order={order} />
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </Fragment>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

            </div>
        </>
    )
}