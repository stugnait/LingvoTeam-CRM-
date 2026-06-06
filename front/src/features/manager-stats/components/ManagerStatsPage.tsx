"use client"

import { useEffect, useState, useRef } from "react"
import { cn } from "@/src/lib/utils"
import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"
import { Button } from "@/src/components/ui/button"
import { Calendar } from "@/src/components/ui/calendar"
import { Input } from "@/src/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/src/components/ui/popover"
import {
    CalendarIcon,
    X,
    ListFilter,
    Users,
    ShoppingBag,
    TrendingUp,
    AlertCircle,
    Search,
    Percent,
} from "lucide-react"
import type { DateRange } from "react-day-picker"

import { ManagerStatsTable } from "./ManagerStatsTable"
import { useManagerStats } from "../hooks/useManagerStats"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatYMD(d: Date) {
    return d.toISOString().split("T")[0]
}

function formatDisplayDate(d: Date) {
    return new Intl.DateTimeFormat("uk-UA", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(d)
}

function formatCurrency(val: number | string) {
    return `${Number(val).toLocaleString("uk-UA", { maximumFractionDigits: 0 })} грн`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ManagerStatsPage() {
    const [range, setRange]           = useState<DateRange | undefined>(undefined)
    const [open, setOpen]             = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const typingTimer                 = useRef<NodeJS.Timeout | null>(null)

    const { data, loading, fetchStats } = useManagerStats()

    const loadData = (currentRange: DateRange | undefined, currentSearch: string) => {
        const params: any = {}
        if (currentRange?.from && currentRange?.to) {
            params.start_date = formatYMD(currentRange.from)
            params.end_date   = formatYMD(currentRange.to)
        }
        if (currentSearch.trim().length > 0) {
            params.search = currentSearch.trim()
        }
        fetchStats(params)
    }

    useEffect(() => {
        loadData(range, searchQuery)
    }, [range, fetchStats])

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setSearchQuery(val)
        if (typingTimer.current) clearTimeout(typingTimer.current)
        typingTimer.current = setTimeout(() => {
            loadData(range, val)
        }, 500)
    }

    const handleClearRange = () => setRange(undefined)

    const displayLabel =
        range?.from && range?.to
            ? `${formatDisplayDate(range.from)} – ${formatDisplayDate(range.to)}`
            : range?.from
                ? `${formatDisplayDate(range.from)} – ...`
                : "Оберіть період"

    // ─── KPI карточки ─────────────────────────────────────────────────────────
    const totalManagers  = data?.length || 0
    const totalOrders    = data?.reduce((acc, m) => acc + (m.total_orders || 0), 0) || 0
    const totalClients   = data?.reduce((acc, m) => acc + (m.total_clients || 0), 0) || 0
    const totalRevenue   = data?.reduce((acc, m) => acc + Number(m.total_revenue || 0), 0) || 0
    const avgMargin      = data?.length
        ? data.reduce((acc, m) => acc + Number(m.avg_margin_percent || 0), 0) / data.length
        : 0
    const totalOverdue   = data?.reduce((acc, m) => acc + (m.overdue_orders_count || 0), 0) || 0

    return (
        <>
            <DashboardHeader />
            <div className="flex flex-col h-full min-h-screen bg-[#F8FAFC] p-4 sm:p-8">

                {/* ─── Заголовок ──────────────────────────────────────── */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Статистика менеджерів
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Замовлення, виручка, маржа та прострочені задачі по кожному менеджеру
                    </p>
                </div>

                {/* ─── KPI Картки ─────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-500">
                                <Users className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Менеджерів</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{totalManagers}</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                                <ShoppingBag className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Замовлень</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{totalOrders}</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                                <Users className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Клієнтів</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{totalClients}</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Загальна виручка</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
                                <Percent className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Середня маржа</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{avgMargin.toFixed(1)}%</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Прострочені</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{totalOverdue}</p>
                    </div>
                </div>

                {/* ─── Панель фільтрів ─────────────────────────────────── */}
                <div className="bg-white p-4 rounded-t-2xl border border-slate-100 border-b-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative w-full sm:w-[320px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Пошук менеджера за іменем..."
                            className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-indigo-500"
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("w-full sm:w-[260px] justify-start gap-2 bg-white font-normal border-slate-200 shadow-sm", !range && "text-slate-500")}>
                                    <CalendarIcon className="w-4 h-4 shrink-0 text-slate-500" />
                                    {displayLabel}
                                    {range && (
                                        <div
                                            role="button"
                                            onClick={(e) => { e.stopPropagation(); handleClearRange() }}
                                            className="ml-auto hover:bg-slate-100 p-1 rounded-full"
                                        >
                                            <X className="w-3 h-3 text-slate-400" />
                                        </div>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar mode="range" selected={range} onSelect={(val) => { setRange(val); if (val?.from && val?.to) setOpen(false) }} numberOfMonths={2} disabled={{ after: new Date() }} />
                            </PopoverContent>
                        </Popover>

                        <Button variant="outline" className="bg-white border-slate-200 shadow-sm gap-2 shrink-0">
                            <ListFilter className="w-4 h-4 text-slate-500" />
                            Фільтри
                        </Button>
                    </div>
                </div>

                {/* ─── Таблиця ─────────────────────────────────────────── */}
                <div className="bg-white rounded-b-2xl border border-slate-100 shadow-sm overflow-hidden flex-1">
                    <ManagerStatsTable data={data} loading={loading} />
                </div>
            </div>
        </>
    )
}