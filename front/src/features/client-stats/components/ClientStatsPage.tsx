"use client"

import { useEffect, useState } from "react"
import { cn } from "@/src/lib/utils"
import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"
import { Button } from "@/src/components/ui/button"
import { Calendar } from "@/src/components/ui/calendar"
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
    Wallet,
    AlertCircle
} from "lucide-react"
import type { DateRange } from "react-day-picker"

import { ClientStatsTable } from "./ClientStatsTable"
import { useClientStats } from "../hooks/useClientStat"

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

export function ClientStatsPage() {
    const [range, setRange] = useState<DateRange | undefined>(undefined)
    const [open, setOpen] = useState(false)

    const { data, loading, fetchStats } = useClientStats()

    useEffect(() => {
        if (range?.from && range?.to) {
            fetchStats({
                start_date: formatYMD(range.from),
                end_date: formatYMD(range.to),
            })
        } else if (!range) {
            fetchStats()
        }
    }, [range, fetchStats])

    const handleClearRange = () => setRange(undefined)

    const displayLabel =
        range?.from && range?.to
            ? `${formatDisplayDate(range.from)} – ${formatDisplayDate(range.to)}`
            : range?.from
                ? `${formatDisplayDate(range.from)} – ...`
                : "Оберіть період"

    // ─── Підрахунок KPI для карток ────────────────────────────────────────────
    const totalClients = data?.length || 0;
    const totalOrders = data?.reduce((acc, curr) => acc + (curr.total_orders || 0), 0) || 0;
    const totalRevenue = data?.reduce((acc, curr) => acc + Number(curr.total_revenue || 0), 0) || 0;
    const avgCheck = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalUnpaid = data?.reduce((acc, curr) => acc + (curr.unpaid_orders_count || 0), 0) || 0;

    return (
        <>
            <DashboardHeader />
            <div className="flex flex-col h-full min-h-screen bg-[#F8FAFC] p-4 sm:p-8">

                {/* ─── Заголовок і Фільтри ─────────────────────────────────────────── */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Статистика клієнтів</h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Замовлення, виручка та середній чек по кожному клієнту
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-[260px] justify-start gap-2 bg-white font-normal border-slate-200 shadow-sm",
                                        !range && "text-slate-500"
                                    )}
                                >
                                    <CalendarIcon className="w-4 h-4 shrink-0 text-slate-500" />
                                    {displayLabel}
                                    {range && (
                                        <div
                                            role="button"
                                            onClick={(e) => { e.stopPropagation(); handleClearRange(); }}
                                            className="ml-auto hover:bg-slate-100 p-1 rounded-full"
                                        >
                                            <X className="w-3 h-3 text-slate-400" />
                                        </div>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    mode="range"
                                    selected={range}
                                    onSelect={(val) => {
                                        setRange(val)
                                        if (val?.from && val?.to) {setOpen(false)}
                                    }}
                                    numberOfMonths={2}
                                    disabled={{ after: new Date() }}
                                />
                            </PopoverContent>
                        </Popover>

                        <Button variant="outline" className="bg-white border-slate-200 shadow-sm gap-2">
                            <ListFilter className="w-4 h-4 text-slate-500" />
                            Фільтри
                        </Button>
                    </div>
                </div>

                {/* ─── 5 Карток KPI ──────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    {/* 1. Клієнтів */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                                <Users className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Клієнтів</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{totalClients}</p>
                        <p className="text-xs text-slate-400 mt-1">Усього клієнтів</p>
                    </div>

                    {/* 2. Замовлень */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                                <ShoppingBag className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Замовлень</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{totalOrders}</p>
                        <p className="text-xs text-slate-400 mt-1">Усього замовлень</p>
                    </div>

                    {/* 3. Загальна сума */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Загальна сума</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</p>
                        <p className="text-xs text-green-500 mt-1 font-medium">+12% <span className="text-slate-400 font-normal">до попер. періоду</span></p>
                    </div>

                    {/* 4. Середній чек */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
                                <Wallet className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Середній чек</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(avgCheck)}</p>
                        <p className="text-xs text-green-500 mt-1 font-medium">+15% <span className="text-slate-400 font-normal">до попер. періоду</span></p>
                    </div>

                    {/* 5. Неоплачені */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Неоплачені</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{totalUnpaid}</p>
                        {totalUnpaid > 0 ? (
                            <p className="text-xs text-red-500 mt-1 font-medium">Є борги клієнтів</p>
                        ) : (
                            <p className="text-xs text-slate-400 mt-1">Усі рахунки оплачено</p>
                        )}
                    </div>
                </div>

                {/* ─── Таблиця ───────────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex-1">
                    <ClientStatsTable data={data} loading={loading} />
                </div>
            </div>
        </>
    )
}