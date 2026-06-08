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
    MoreHorizontal,
    ChevronDown,
    User,
    Wallet,
    Languages,
    TrendingUp,
    AlertCircle
} from "lucide-react"

import { useClientDetail } from "../hooks/useClientStat"

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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ChartSkeleton({ height = 160 }: { height?: number }) {
    return (
        <div
            className="w-full bg-slate-100 animate-pulse rounded-xl mt-2"
            style={{ height }}
        />
    )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClientDetailPage() {
    const params   = useParams()
    const router   = useRouter()
    const clientId = Number(params?.id)

    const [range, setRange] = useState<DateRange | undefined>(undefined)
    const [open, setOpen]   = useState(false)

    const { data, loading, fetchDetail } = useClientDetail(clientId)

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

    const client = data?.client_info

    // ── Підрахунок KPI ────────────────────────────────────────────────────────
    const totalOrders = data?.orders_chart?.reduce((acc, curr) => acc + (curr.count || 0), 0) || 0;
    const totalRevenue = data?.revenue_chart?.reduce((acc, curr) => acc + Number(curr.amount || 0), 0) || 0;
    const avgCheck = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalPairs = data?.language_pairs?.length || 0;
    const unpaidOrders = client?.unpaid_orders_count || 0; // Заглушка, поки бекенд не віддасть це поле

    // ── 1. Pie chart (Мовні пари) ─────────────────────────────────────────────
    const pairLabels = data?.language_pairs?.map((p) => p.pair_name) ?? []
    const pairCounts = data?.language_pairs?.map((p) => p.count) ?? []

    const pieOptions: ApexCharts.ApexOptions = {
        chart: {
            type: "donut",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
            animations: { enabled: true },
        },
        labels: pairLabels,
        colors: ["#8b5cf6", "#c4b5fd", "#6366f1", "#a855f7", "#ec4899"],
        dataLabels: { enabled: false },
        legend: {
            position: "right",
            fontSize: "13px",
            markers: { size: 6, strokeWidth: 0 },
            itemMargin: { vertical: 4 },
            formatter: function (seriesName, opts) {
                if (!opts || !opts.w || !opts.w.globals) {
                    return `<div class="flex justify-between w-full min-w-[120px]">
                                <span class="text-slate-600">${seriesName}</span>
                            </div>`
                }

                const val = opts.w.globals.seriesTotals[opts.seriesIndex] ?? 0
                const totalsArr = opts.w.globals.seriesTotals ?? []
                const total = totalsArr.reduce((a: number, b: number) => a + b, 0)
                const percent = total > 0 ? Math.round((val / total) * 100) : 0

                return `<div class="flex justify-between w-full min-w-[120px]">
                            <span class="text-slate-600">${seriesName}</span>
                            <span class="font-medium ml-4 text-slate-900">${val} (${percent}%)</span>
                        </div>`
            }
        },
        stroke: { width: 0 },
        plotOptions: {
            pie: {
                donut: {
                    size: "75%",
                    labels: {
                        show: true,
                        name: { show: false },
                        value: {
                            show: true,
                            fontSize: "22px",
                            fontWeight: 700,
                            color: "#0f172a",
                            formatter: () => `${totalPairs}`,
                        },
                        total: {
                            show: true,
                            label: "Всього",
                            fontSize: "11px",
                            color: "#64748b",
                            formatter: () => `${totalPairs}`,
                        },
                    },
                },
            },
        },
        tooltip: { theme: "light" },
    }

    // ── 2. Line Chart Factory (Area & Bar) ────────────────────────────────────
    const makeAreaOptions = (
        categories: string[],
        color: string,
        yFormatter?: (val: number) => string
    ): ApexCharts.ApexOptions => {
        const isSinglePoint = categories.length === 1

        return {
            chart: {
                type: "area",
                fontFamily: "ui-sans-serif, system-ui, sans-serif",
                toolbar: { show: false },
                zoom: { enabled: false },
            },
            colors: [color],

            dataLabels: {
                enabled: false,
            },

            stroke: {
                curve: isSinglePoint ? "straight" : "smooth",
                width: 3,
            },

            fill: {
                type: "gradient",
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.3,
                    opacityTo: 0,
                    stops: [0, 90, 100],
                },
            },
            markers: {
                size: isSinglePoint ? 6 : 4,
                colors: ["#fff"],
                strokeColors: color,
                strokeWidth: 2,
            },
            grid: {
                borderColor: "#f1f5f9",
                xaxis: {
                    lines: {
                        show: false,
                    },
                },
                yaxis: {
                    lines: {
                        show: true,
                    },
                },
            },

            xaxis: {
                categories,
                labels: {
                    style: {
                        colors: "#94a3b8",
                        fontSize: "11px",
                    },
                },
            },

            yaxis: {
                tickAmount: 4,
                labels: {
                    formatter: (val) =>
                        yFormatter
                            ? yFormatter(Number(val))
                            : String(Math.round(Number(val || 0))),
                },
            },
            tooltip: {
                theme: "light",
                y: {
                    formatter: (val) =>
                        yFormatter
                            ? yFormatter(Number(val))
                            : String(Math.round(Number(val || 0))),
                },
            },
        }
    }

    const makeBarOptions = (
        categories: string[],
        color: string,
        yFormatter?: (val: number) => string
    ): ApexCharts.ApexOptions => ({
        chart: {
            type: "bar",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
            toolbar: { show: false },
        },
        colors: [color],
        plotOptions: {
            bar: {
                columnWidth: "40%",
                borderRadius: 4,
            },
        },
        dataLabels: { enabled: false },
        fill: {
            type: "gradient",
            gradient: {
                shade: "light",
                type: "vertical",
                gradientToColors: ["#a855f7"],
                stops: [0, 100],
            },
        },
        grid: { borderColor: "#f1f5f9", xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
        xaxis: {
            type: "category",
            categories,
            labels: { style: { colors: "#94a3b8", fontSize: "11px", fontWeight: 500 } },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            tickAmount: 4,
            labels: {
                style: { colors: "#94a3b8", fontSize: "11px", fontWeight: 500 },
                formatter: yFormatter ?? ((val) => val != null ? String(Math.round(val)) : "0"),
            },
        },
        tooltip: {
            theme: "light",
            y: yFormatter ? { formatter: yFormatter } : undefined,
        },
    })

    // Formatting data for charts
    const ordersCategories  = data?.orders_chart?.map((p) => p.date ? new Date(p.date).toLocaleString('uk-UA', { day: 'numeric', month: 'short' }) : "") ?? []
    const ordersSeries  = [{ name: "Замовлення", data: data?.orders_chart?.map((p) => p.count || 0) ?? [] }]

    const revenueCategories = data?.revenue_chart?.map((p) => p.date ? new Date(p.date).toLocaleString('uk-UA', { day: 'numeric', month: 'short' }) : "") ?? []
    const revenueSeries = [{ name: "Дохід", data: data?.revenue_chart?.map((p) => Number(p.amount || 0)) ?? [] }]

    const ordersOptions  = makeAreaOptions(ordersCategories, "#8b5cf6")
    const revenueOptions = makeBarOptions(revenueCategories, "#6366f1", (val) => `${val.toLocaleString("uk-UA")} ₴`)
    const lessonOptions  = makeAreaOptions(ordersCategories, "#3b82f6")

    return (
        <>
            <DashboardHeader />
            <div className="flex flex-col min-h-screen bg-[#F8FAFC] p-4 sm:p-8">

                {/* ─── Кнопка назад ──────────────────────────────────────────── */}
                <div className="mb-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="gap-2 text-slate-500 hover:text-slate-900 font-medium -ml-3 px-3 rounded-lg"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Назад до списку
                    </Button>
                </div>

                {/* ─── Картка Клієнта (Верхній блок з Summary) ───────────────── */}
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm mb-6 overflow-hidden">

                    {/* Верхня частина: Дані клієнта + Фільтр */}
                    <div className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-full bg-[#8b5cf6] flex items-center justify-center text-2xl font-bold text-white shrink-0 shadow-sm">
                                {client?.full_name?.[0]?.toUpperCase() ?? "C"}
                            </div>
                            <div className="flex-1 mt-1">
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                                    {client?.full_name ?? `Клієнт #${clientId}`}
                                </h1>
                                <p className="text-slate-500 mt-0.5 text-sm">
                                    {client?.email ?? "Email відсутній"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-[260px] justify-start gap-2 bg-white font-normal border-slate-200 rounded-lg shadow-sm text-sm",
                                            !range && "text-slate-500"
                                        )}
                                    >
                                        <CalendarIcon className="w-4 h-4 shrink-0 text-slate-500" />
                                        {displayLabel}
                                        <ChevronDown className="w-4 h-4 ml-auto text-slate-400" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar
                                        mode="range"
                                        selected={range}
                                        onSelect={(val) => {
                                            setRange(val)
                                            if (val?.from && val?.to) setOpen(false)
                                        }}
                                        numberOfMonths={2}
                                        disabled={{ after: new Date() }}
                                    />
                                </PopoverContent>
                            </Popover>

                            {range && (
                                <Button
                                    variant="ghost"
                                    onClick={() => setRange(undefined)}
                                    className="text-slate-500 hover:text-slate-900 px-3 text-sm"
                                >
                                    Очистити
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Нижня частина: Рядок статистики (аналог Table Row) */}
                    <div className="bg-slate-50/50 border-t border-slate-100 p-6 flex flex-wrap items-center gap-8 md:gap-20">
                        {/* 1. Замовлення */}
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                                Замовлення
                            </p>
                            <p className="text-xl font-bold text-slate-900">
                                {totalOrders}
                            </p>
                        </div>

                        {/* 2. Загальна сума */}
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                                Загальна сума
                            </p>
                            <div className="flex items-center gap-2">
                                {totalRevenue > 0 && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                                <p className="text-xl font-bold text-slate-900">
                                    {formatCurrency(totalRevenue)}
                                </p>
                            </div>
                        </div>

                        {/* 3. Середній чек */}
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                                Середній чек
                            </p>
                            <p className="text-xl font-bold text-slate-900">
                                {formatCurrency(avgCheck)}
                            </p>
                        </div>

                        {/* 4. Неоплачені */}
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                                Неоплачені
                            </p>
                            {unpaidOrders > 0 ? (
                                <div className="inline-flex items-center justify-center gap-1.5 bg-red-50 text-red-600 border border-red-100 rounded-full px-3 py-1 text-xs font-bold">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    {unpaidOrders}
                                </div>
                            ) : (
                                <span className="text-slate-400 font-medium text-base pl-1">0</span>
                            )}
                        </div>
                    </div>

                </div>

                {/* ─── 4 Графіки (Grid 2x2) ──────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">

                    {/* 1. Мовні пари (Donut) */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col relative">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                Мовні пари <Info className="w-4 h-4 text-slate-400 cursor-pointer" />
                            </h3>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                <MoreHorizontal className="w-5 h-5" />
                            </Button>
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                            {loading ? (
                                <ChartSkeleton height={160} />
                            ) : !pairCounts.length ? (
                                <div className="text-slate-400 text-sm py-10">Дані відсутні</div>
                            ) : (
                                <div className="w-full">
                                    <ReactApexChart options={pieOptions} series={pairCounts} type="donut" height={180} />
                                </div>
                            )}
                        </div>
                        <div className="absolute bottom-6 right-6">
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                                <Languages className="w-3 h-3" />
                                {totalPairs} мовна пара
                            </div>
                        </div>
                    </div>

                    {/* 2. Кількість замовлень (Area) */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col">
                        <div className="flex justify-between items-start mb-0">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
                                    Кількість замовлень <Info className="w-4 h-4 text-slate-400 cursor-pointer" />
                                </h3>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-2xl font-bold text-slate-900">{totalOrders}</span>
                                </div>
                                <p className="text-[11px] font-medium text-emerald-500 mt-1">
                                    ↑ 33% <span className="text-slate-400 font-normal">порівняно з попереднім періодом</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 border border-slate-200 rounded-md px-2.5 py-1 text-[11px] text-slate-600 cursor-pointer hover:bg-slate-50">
                                    По місяцях <ChevronDown className="w-3 h-3" />
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                    <MoreHorizontal className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 mt-2 -mx-2">
                            {loading ? <ChartSkeleton height={160} /> : <ReactApexChart options={ordersOptions} series={ordersSeries} type="area" height={160} />}
                        </div>
                    </div>

                    {/* 3. Дохід (Bar) */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col">
                        <div className="flex justify-between items-start mb-0">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
                                    Дохід <Info className="w-4 h-4 text-slate-400 cursor-pointer" />
                                </h3>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-2xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</span>
                                </div>
                                <p className="text-[11px] font-medium text-emerald-500 mt-1">
                                    ↑ 18% <span className="text-slate-400 font-normal">порівняно з попереднім періодом</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 border border-slate-200 rounded-md px-2.5 py-1 text-[11px] text-slate-600 cursor-pointer hover:bg-slate-50">
                                    По місяцях <ChevronDown className="w-3 h-3" />
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                    <MoreHorizontal className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 mt-2 -mx-2">
                            {loading ? <ChartSkeleton height={130} /> : <ReactApexChart options={revenueOptions} series={revenueSeries} type="bar" height={130} />}
                        </div>
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-50">
                            <div className="flex items-center gap-2 bg-slate-50 text-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium">
                                <User className="w-3.5 h-3.5 text-[#8b5cf6]" />
                                Середній чек <span className="font-bold ml-1">{formatCurrency(avgCheck)}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-50 text-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium">
                                <Wallet className="w-3.5 h-3.5 text-[#8b5cf6]" />
                                Оплачено замовлень <span className="font-bold ml-1">{totalOrders}</span>
                            </div>
                        </div>
                    </div>

                    {/* 4. Місяць / Урок (Mock Area) */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col">
                        <div className="flex justify-between items-start mb-0">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
                                    Місяць / Урок <Info className="w-4 h-4 text-slate-400 cursor-pointer" />
                                </h3>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-2xl font-bold text-slate-900">9,6</span>
                                </div>
                                <p className="text-[11px] font-normal text-slate-400 mt-1">
                                    Середнє значення за період
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 border border-slate-200 rounded-md px-2.5 py-1 text-[11px] text-slate-600 cursor-pointer hover:bg-slate-50">
                                    По місяцях <ChevronDown className="w-3 h-3" />
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                    <MoreHorizontal className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 mt-2 -mx-2">
                            {loading ? <ChartSkeleton height={160} /> : <ReactApexChart options={lessonOptions} series={ordersSeries} type="area" height={160} />}
                        </div>
                    </div>

                </div>
            </div>
        </>
    )
}