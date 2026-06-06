"use client"

import dynamic from "next/dynamic"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { DateRange } from "react-day-picker"

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
    ChevronLeft,
    CalendarIcon,
    X,
    Info,
    ChevronDown,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    Users
} from "lucide-react"

import { useManagerDetail } from "../hooks/useManagerStats"

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false })

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatYMD(d: Date) {
    return d.toISOString().split("T")[0]
}

function formatDisplayDate(d: Date) {
    return new Intl.DateTimeFormat("uk-UA", {
        day: "2-digit", month: "short", year: "numeric",
    }).format(d).replace(' р.', '')
}

function formatCurrency(val: number | string) {
    return `${Number(val).toLocaleString("uk-UA", { maximumFractionDigits: 0 })} грн`
}

function ChartSkeleton({ height = 160 }: { height?: number }) {
    return <div className="w-full bg-slate-100 animate-pulse rounded-xl mt-2" style={{ height }} />
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ManagerDetailPage() {
    const params    = useParams()
    const router    = useRouter()
    const managerId = Number(params?.id)

    const [range, setRange] = useState<DateRange | undefined>(undefined)
    const [open, setOpen]   = useState(false)

    const { data, loading, fetchDetail } = useManagerDetail(managerId)

    useEffect(() => {
        if (range?.from && range?.to) {
            fetchDetail({ start_date: formatYMD(range.from), end_date: formatYMD(range.to) })
        } else {
            fetchDetail()
        }
    }, [range, fetchDetail])

    const displayLabel =
        range?.from && range?.to
            ? `${formatDisplayDate(range.from)} – ${formatDisplayDate(range.to)}`
            : range?.from
                ? `${formatDisplayDate(range.from)} – ...`
                : "Оберіть період"

    const manager = data?.manager_info
    const summary = data?.summary

    // ── Factory для налаштувань ApexCharts ────────────────────────────────────

    // Спільний об'єкт для тултіпа, щоб виглядало однаково
    const commonTooltip = {
        theme: "light",
        y: { formatter: (val: number) => val.toLocaleString("uk-UA") }
    }

    const makeAreaOptions = (categories: string[], color: string): ApexCharts.ApexOptions => ({
        chart: { type: "area", fontFamily: "ui-sans-serif, system-ui, sans-serif", toolbar: { show: false }, zoom: { enabled: false } },
        colors: [color],
        stroke: { curve: "smooth", width: 3 },
        fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0, stops: [0, 90, 100] } },
        markers: { size: 4, colors: ["#fff"], strokeColors: color, strokeWidth: 2 },
        grid: { borderColor: "#f1f5f9", xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
        xaxis: { type: "category", categories, labels: { style: { colors: "#94a3b8", fontSize: "11px" } } },
        yaxis: { tickAmount: 4, labels: { style: { colors: "#94a3b8", fontSize: "11px" } } },
        tooltip: commonTooltip
    })

    const makeBarOptions = (categories: string[], color: string): ApexCharts.ApexOptions => ({
        chart: { type: "bar", fontFamily: "ui-sans-serif, system-ui, sans-serif", toolbar: { show: false } },
        colors: [color],
        plotOptions: { bar: { columnWidth: "30%", borderRadius: 4 } },
        fill: { type: "gradient", gradient: { shade: "light", type: "vertical", gradientToColors: ["#a855f7"], stops: [0, 100] } },
        grid: { borderColor: "#f1f5f9", xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
        xaxis: { type: "category", categories, labels: { style: { colors: "#94a3b8", fontSize: "11px" } } },
        yaxis: { tickAmount: 4, labels: { style: { colors: "#94a3b8", fontSize: "11px" }, formatter: (val) => `${val.toLocaleString("uk-UA")} ₴` } },
        tooltip: { theme: "light", y: { formatter: (val: number) => `${val.toLocaleString("uk-UA")} ₴` } }
    })

    const ordersCategories = data?.orders_chart?.map((p) => p.date ? new Date(p.date).toLocaleString('uk-UA', { day: 'numeric', month: 'short' }) : "") ?? []
    const ordersSeries     = [{ name: "Замовлення", data: data?.orders_chart?.map((p) => p.count || 0) ?? [] }]

    const revenueCategories = data?.revenue_chart?.map((p) => p.date ? new Date(p.date).toLocaleString('uk-UA', { day: 'numeric', month: 'short' }) : "") ?? []
    const revenueSeries     = [{ name: "Дохід", data: data?.revenue_chart?.map((p) => Number(p.amount || 0)) ?? [] }]

    return (
        <>
            <DashboardHeader />
            <div className="flex flex-col min-h-screen bg-[#F8FAFC] p-4 sm:p-8">
                <div className="mb-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 text-slate-500 hover:text-slate-900 font-medium -ml-3 px-3 rounded-lg">
                        <ChevronLeft className="w-4 h-4" /> Назад до списку
                    </Button>
                </div>

                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm mb-6 overflow-hidden">
                    <div className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center text-2xl font-bold text-violet-600 shrink-0 shadow-sm border border-violet-200">
                                {manager?.full_name?.[0]?.toUpperCase() ?? "M"}
                            </div>
                            <div className="flex-1 mt-1">
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{manager?.full_name ?? "Завантаження..."}</h1>
                                <p className="text-slate-500 mt-0.5 text-sm">{manager?.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-[260px] justify-start gap-2 bg-white font-normal border-slate-200 rounded-lg shadow-sm text-sm">
                                        <CalendarIcon className="w-4 h-4 text-slate-500" /> {displayLabel} <ChevronDown className="w-4 h-4 ml-auto text-slate-400" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar mode="range" selected={range} onSelect={setRange} numberOfMonths={2} />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="bg-slate-50/50 border-t border-slate-100 p-6 flex flex-wrap items-center gap-8 md:gap-16">
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Замовлення</p>
                            <p className="text-xl font-bold text-slate-900">{summary?.total_orders || 0}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Клієнти</p>
                            <p className="text-xl font-bold text-slate-900">{summary?.total_clients || 0}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Виручка</p>
                            <p className="text-xl font-bold text-slate-900">{formatCurrency(summary?.total_revenue || 0)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Маржа</p>
                            <p className="text-xl font-bold text-slate-900">{Number(summary?.avg_margin_percent || 0).toFixed(1)}%</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Прострочені</p>
                            <p className="text-xl font-bold text-slate-900">{summary?.overdue_orders_count || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-base font-bold text-slate-900 mb-6">Кількість замовлень</h3>
                        {loading ? <ChartSkeleton height={200} /> : <ReactApexChart options={makeAreaOptions(ordersCategories, "#8b5cf6")} series={ordersSeries} type="area" height={220} />}
                    </div>
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-base font-bold text-slate-900 mb-6">Дохід (Виручка)</h3>
                        {loading ? <ChartSkeleton height={200} /> : <ReactApexChart options={makeBarOptions(revenueCategories, "#6366f1")} series={revenueSeries} type="bar" height={220} />}
                    </div>
                </div>
            </div>
        </>
    )
}