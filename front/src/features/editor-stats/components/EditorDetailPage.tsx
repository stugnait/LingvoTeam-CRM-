"use client"

import dynamic from "next/dynamic"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import type { DateRange } from "react-day-picker"

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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/src/components/ui/table"
import {
    ChevronLeft,
    CalendarIcon,
    ChevronDown,
    AlertCircle,
    ShoppingBag,
    X,
    Search,
    Clock,
    FileText
} from "lucide-react"

import { useEditorDetail, useEditorOrders } from "../hooks/useEditorStats"
import type { EditorOrder } from "../types"

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false })

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatYMD(d: Date) { return d.toISOString().split("T")[0] }
function formatDisplayDate(d: Date) { return new Intl.DateTimeFormat("uk-UA", { day: "2-digit", month: "short", year: "numeric" }).format(d).replace(" р.", "") }
function formatCurrency(val: number | string) { return `${Number(val || 0).toLocaleString("uk-UA", { maximumFractionDigits: 0 })} грн` }
function formatDate(val: string) {
    if (!val) return "—"
    return new Intl.DateTimeFormat("uk-UA", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(val))
}
function ChartSkeleton({ height = 180 }: { height?: number }) { return <div className="w-full bg-slate-100 animate-pulse rounded-xl mt-2" style={{ height }} /> }

function statusStyle(id?: number) {
    if (!id) return "bg-slate-100 text-slate-500"
    if ([2, 9].includes(id)) return "bg-emerald-50 text-emerald-700 border border-emerald-100"
    if ([3].includes(id))    return "bg-red-50 text-red-600 border border-red-100"
    if ([11].includes(id))   return "bg-amber-50 text-amber-600 border border-amber-100"
    return "bg-blue-50 text-blue-600 border border-blue-100"
}

function isOverdue(deadline: string, statusId?: number) {
    if (!deadline) return false
    if (statusId && [2, 3, 9].includes(statusId)) return false
    return new Date(deadline) < new Date()
}

const STATUS_NAMES: Record<number, string> = {
    1: "New", 2: "Done", 3: "Rejected", 4: "In Progress", 5: "Paid", 7: "In Review", 8: "In Checking", 9: "Checked", 11: "Revision",
}

function OrdersTable({ data, loading }: { data: EditorOrder[]; loading: boolean }) {
    return (
        <div className="overflow-auto">
            <Table>
                <TableHeader className="bg-white">
                    <TableRow className="hover:bg-transparent border-b border-slate-100">
                        <TableHead className="h-12 pl-6 font-semibold text-slate-700 w-[180px]">ID / Дата</TableHead>
                        <TableHead className="h-12 font-semibold text-slate-700">Дедлайн</TableHead>
                        <TableHead className="h-12 font-semibold text-slate-700">Сторінки</TableHead>
                        <TableHead className="h-12 font-semibold text-slate-700">Коментар</TableHead>
                        <TableHead className="h-12 font-semibold text-slate-700 text-center w-[150px]">Статус</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-400">Завантаження замовлень...</TableCell></TableRow>
                    ) : data.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-400">Замовлення відсутні за вибраними параметрами</TableCell></TableRow>
                    ) : (
                        data.map((order) => {
                            // Безпечно витягуємо ID статусу
                            const statusId = order.status?.id

                            // Перевіряємо, чи прострочено
                            const overdue = isOverdue(order.deadline, statusId)

                            // Беремо назву з об'єкта status, або зі словника, або ставимо заглушку
                            const statusName = order.status?.name || (statusId ? STATUS_NAMES[statusId] : "Без статусу")

                            return (
                                <TableRow key={order.id} className="transition-colors hover:bg-slate-50 border-b border-slate-50 last:border-0">
                                    <TableCell className="py-4 pl-6">
                                        <p className="font-semibold text-slate-900 text-sm">#{order.id}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{formatDate(order.created_at)}</p>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex items-center gap-1.5">
                                            {overdue && <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                                            <span className={overdue ? "text-sm font-medium text-red-600" : "text-sm text-slate-600"}>{formatDate(order.deadline)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4"><span className="text-sm text-slate-600">{order.page_count ?? "—"}</span></TableCell>
                                    <TableCell className="py-4 max-w-[260px]">
                                        {order.client_comment ? <span className="text-sm text-slate-600 truncate block">{order.client_comment}</span> : <span className="text-slate-400 text-sm italic">—</span>}
                                    </TableCell>
                                    <TableCell className="py-4 text-center">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle(statusId)}`}>
                                            {statusName}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            )
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    )
}

// ─── Головний компонент ───────────────────────────────────────────────────────
export default function EditorDetailPage() {
    const params   = useParams()
    const router   = useRouter()
    const editorId = Number(params?.id)

    const [range, setRange] = useState<DateRange | undefined>(undefined)
    const [open, setOpen]   = useState(false)

    const [searchQuery, setSearchQuery] = useState("")
    const typingTimer = useRef<NodeJS.Timeout | null>(null)

    const { data, loading, fetchDetail } = useEditorDetail(editorId)
    const { data: orders, loading: ordersLoading, fetchOrders } = useEditorOrders(editorId)

    useEffect(() => {
        const p = range?.from && range?.to ? { start_date: formatYMD(range.from), end_date: formatYMD(range.to) } : undefined
        fetchDetail(p)
        fetchOrders({ ...p, search: searchQuery || undefined })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [range, fetchDetail, fetchOrders])

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setSearchQuery(val)
        if (typingTimer.current) clearTimeout(typingTimer.current)
        typingTimer.current = setTimeout(() => {
            const p = range?.from && range?.to ? { start_date: formatYMD(range.from), end_date: formatYMD(range.to) } : undefined
            fetchOrders({ ...p, search: val || undefined })
        }, 500)
    }

    const displayLabel = range?.from && range?.to
        ? `${formatDisplayDate(range.from)} – ${formatDisplayDate(range.to)}`
        : range?.from ? `${formatDisplayDate(range.from)} – ...` : "Оберіть період"

    const editor  = data?.editor_info
    const summary = data?.summary

    // ── Графіки ───────────────────────────────────────────────────────────────

    // 1. Графік замовлень
    const ordersCategories = data?.orders_chart?.map((p) => p.date ? new Date(p.date).toLocaleString("uk-UA", { day: "numeric", month: "short" }) : "") ?? []
    const ordersSeries = [{ name: "Замовлення", data: data?.orders_chart?.map((p) => p.count || 0) ?? [] }]

    // 2. Графік часу на сторінку
    const timeCategories = data?.time_chart?.map((p) => p.date ? new Date(p.date).toLocaleString("uk-UA", { day: "numeric", month: "short" }) : "") ?? []
    const timeSeries = [{ name: "Годин на стор.", data: data?.time_chart?.map((p) => Number(p.time_per_page || 0)) ?? [] }]

    const makeAreaOptions = (categories: string[], color: string): ApexCharts.ApexOptions => ({
        chart: { type: "area", fontFamily: "ui-sans-serif, system-ui, sans-serif", toolbar: { show: false }, zoom: { enabled: false } },
        colors: [color],
        stroke: { curve: "smooth", width: 3 },
        fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0, stops: [0, 90, 100] } },
        markers: { size: 4, colors: ["#fff"], strokeColors: color, strokeWidth: 2 },
        grid: { borderColor: "#f1f5f9", xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
        xaxis: { type: "category", categories, labels: { style: { colors: "#94a3b8", fontSize: "11px" } }, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { tickAmount: 4, labels: { style: { colors: "#94a3b8", fontSize: "11px" }, formatter: (v) => String(Math.round(Number(v || 0))) } },
        tooltip: { theme: "light", y: { formatter: (v) => String(Math.round(Number(v || 0))) } },
    })

    const makeTimeOptions = (categories: string[], color: string): ApexCharts.ApexOptions => ({
        chart: { type: "bar", fontFamily: "ui-sans-serif, system-ui, sans-serif", toolbar: { show: false } },
        colors: [color],
        plotOptions: { bar: { columnWidth: "30%", borderRadius: 4 } },
        dataLabels: { enabled: false },
        fill: { type: "gradient", gradient: { shade: "light", type: "vertical", gradientToColors: ["#3b82f6"], stops: [0, 100] } },
        grid: { borderColor: "#f1f5f9", xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
        xaxis: { type: "category", categories, labels: { style: { colors: "#94a3b8", fontSize: "11px" } }, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { tickAmount: 4, labels: { style: { colors: "#94a3b8", fontSize: "11px" }, formatter: (v) => `${Number(v || 0).toFixed(1)} год` } },
        tooltip: { theme: "light", y: { formatter: (v) => `${Number(v || 0).toFixed(1)} год/стор` } },
    })

    return (
        <>
            <DashboardHeader />
            <div className="flex flex-col min-h-screen bg-[#F8FAFC] p-4 sm:p-8">

                {/* ─── Назад ──────────────────────────────────────────────── */}
                <div className="mb-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 text-slate-500 hover:text-slate-900 font-medium -ml-3 px-3 rounded-lg">
                        <ChevronLeft className="w-4 h-4" /> Назад до списку
                    </Button>
                </div>

                {/* ─── Картка редактора ────────────────────────────────────── */}
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm mb-6 overflow-hidden">
                    <div className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-2xl font-bold text-blue-600 shrink-0 shadow-sm">
                                {editor?.full_name?.[0]?.toUpperCase() ?? "E"}
                            </div>
                            <div className="mt-1">
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{editor?.full_name ?? "Завантаження..."}</h1>
                                <p className="text-slate-500 mt-0.5 text-sm">{editor?.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-[260px] justify-start gap-2 bg-white font-normal border-slate-200 rounded-lg shadow-sm text-sm text-slate-500">
                                        <CalendarIcon className="w-4 h-4 shrink-0 text-slate-500" />
                                        {displayLabel}
                                        <ChevronDown className="w-4 h-4 ml-auto text-slate-400" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar mode="range" selected={range} onSelect={(val) => { setRange(val); if (val?.from && val?.to) setOpen(false) }} numberOfMonths={2} disabled={{ after: new Date() }} />
                                </PopoverContent>
                            </Popover>
                            {range && (
                                <Button variant="ghost" size="sm" onClick={() => setRange(undefined)} className="text-slate-400 hover:text-slate-700 px-2">
                                    <X className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-50/50 border-t border-slate-100 p-6 flex flex-wrap items-start gap-8 md:gap-16">
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Замовлення</p>
                            <p className="text-xl font-bold text-slate-900">{summary?.total_orders || 0}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Сторінки</p>
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-500" />
                                <p className="text-xl font-bold text-slate-900">{summary?.total_pages || 0}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Час на сторінку</p>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-500" />
                                <p className="text-xl font-bold text-slate-900">{Number(summary?.avg_time_per_page || 0).toFixed(1)} год</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Виручка</p>
                            <p className="text-xl font-bold text-slate-900">{formatCurrency(summary?.total_revenue || 0)}</p>
                        </div>
                    </div>
                </div>

                {/* ─── Два графіки ─────────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-base font-bold text-slate-900 mb-1">Кількість замовлень</h3>
                        <p className="text-2xl font-bold text-slate-900 mb-2">{summary?.total_orders || 0}</p>
                        <div className="-mx-2">
                            {loading
                                ? <ChartSkeleton height={200} />
                                : <ReactApexChart options={makeAreaOptions(ordersCategories, "#3b82f6")} series={ordersSeries} type="area" height={220} />
                            }
                        </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-base font-bold text-slate-900 mb-1">Час на сторінку (год/стор)</h3>
                        <p className="text-2xl font-bold text-slate-900 mb-2">{Number(summary?.avg_time_per_page || 0).toFixed(1)} год</p>
                        <div className="-mx-2">
                            {loading
                                ? <ChartSkeleton height={200} />
                                : <ReactApexChart options={makeTimeOptions(timeCategories, "#6366f1")} series={timeSeries} type="bar" height={220} />
                            }
                        </div>
                    </div>
                </div>

                {/* ─── Таблиця всіх замовлень з Пошуком ────────────────────── */}
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden mb-10">
                    <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Всі замовлення</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Перелік замовлень, перевірених даним редактором</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <div className="relative w-full sm:w-[300px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Пошук (Назва, коментар, ID)..."
                                    className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-blue-500 h-9"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                />
                            </div>

                            <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-3 py-1.5 text-xs font-semibold shrink-0">
                                <ShoppingBag className="w-3.5 h-3.5" />
                                {ordersLoading ? "..." : orders.length} замовлень
                            </div>
                        </div>
                    </div>

                    <OrdersTable data={orders} loading={ordersLoading} />
                </div>

            </div>
        </>
    )
}