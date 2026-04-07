"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"
import { useStats } from "../hooks/useStats"

import type { Order, StatsItem, SalesChartItem, PnLBreakdownItem, ConversionStats } from "../types"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/src/components/ui/card"

import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { BarChart3, Table as TableIcon } from "lucide-react"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

const commonResponsiveConfig = [
    {
        breakpoint: 768,
        options: {
            yaxis: {
                title: { text: '' },
                labels: {
                    formatter: (val: any) => val !== null && val !== undefined ? parseFloat(val.toFixed(2)) : val
                }
            },
            grid: { padding: { left: 10, right: 10, top: 10, bottom: 0 } },
            xaxis: { labels: { style: { fontSize: '10px' } } }
        }
    },
    {
        breakpoint: 480,
        options: {
            chart: { toolbar: { show: false } },
            legend: { fontSize: '10px', itemMargin: { horizontal: 5, vertical: 2 } },
            markers: { size: 3, hover: { size: 5 } },
            grid: { padding: { left: 5, right: 5, top: 10, bottom: 0 } },
            xaxis: { labels: { rotate: -45, style: { fontSize: '9px' } } },
            yaxis: {
                labels: {
                    style: { fontSize: '9px' },
                    formatter: (val: any) => val !== null && val !== undefined ? parseFloat(val.toFixed(2)) : val
                }
            }
        }
    }
];

export function StatsPage() {
    const {
        loading,

        ownerOrders,

        unpaidOrders,
        overduePayments,
        highRiskOrders,

        conversion,
        salesChart,

        managersStats,
        clientsStats,
        translatorsStats,

        pnl,

        fetchOwnerOrders,
        fetchUnpaidOrders,
        fetchOverduePayments,
        fetchHighRiskOrders,
        fetchConversion,
        fetchSalesChart,
        fetchManagersStats,
        fetchClientsStats,
        fetchTranslatorsStats,
        fetchPnL,
    } = useStats()

    const [dates, setDates] = useState({
        start_date: "",
        end_date: "",
    })

    const [groupBy, setGroupBy] = useState<"client" | "manager" | "translator" | "language_pair">("language_pair")

    // initial load
    useEffect(() => {
        fetchUnpaidOrders()
        fetchOverduePayments()
        fetchHighRiskOrders()
        fetchOwnerOrders()
    }, [])

    const loadAnalytics = () => {
        fetchConversion(dates)
        fetchSalesChart(dates)
        fetchManagersStats(dates)
        fetchClientsStats(dates)
        fetchTranslatorsStats(dates)
        fetchPnL({ ...dates, group_by: groupBy })
    }

    return (
        <>
            <DashboardHeader />

            <main className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-7xl space-y-6">

                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-2xl font-bold">Statistics Dashboard</h2>
                            <p className="text-muted-foreground">
                                Business insights and financial analytics
                            </p>
                        </div>
                    </div>

                    {/* DATE & PNL FILTER */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Filters</CardTitle>
                            <CardDescription>Select period and grouping</CardDescription>
                        </CardHeader>
                        <CardContent className="flex gap-4 items-center">
                            <Input
                                type="date"
                                value={dates.start_date}
                                onChange={(e) => setDates(prev => ({ ...prev, start_date: e.target.value }))}
                            />

                            <Input
                                type="date"
                                value={dates.end_date}
                                onChange={(e) => setDates(prev => ({ ...prev, end_date: e.target.value }))}
                            />

                            <select
                                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                value={groupBy}
                                onChange={(e) => setGroupBy(e.target.value as any)}
                            >
                                <option value="language_pair">Language Pair</option>
                                <option value="client">Client</option>
                                <option value="manager">Manager</option>
                                <option value="translator">Translator</option>
                            </select>

                            <Button onClick={loadAnalytics} disabled={loading}>
                                Load
                            </Button>
                        </CardContent>
                    </Card>

                    {/* KPI CARDS */}
                    <div className="grid grid-cols-5 gap-4">
                        <KpiCard title="Revenue" value={pnl?.summary.revenue} />
                        <KpiCard title="COGS" value={pnl?.summary.cogs} />
                        <KpiCard title="Profit" value={pnl?.summary.net_profit} />
                        <KpiCard title="Margin %" value={pnl?.summary.gross_margin_percent} />
                        <KpiCard title="OPEX" value={pnl?.summary.opex} />
                    </div>

                    <Tabs defaultValue="charts" className="space-y-6">
                        <TabsList className="grid w-[400px] grid-cols-2">
                            <TabsTrigger value="charts" className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4" /> Charts
                            </TabsTrigger>
                            <TabsTrigger value="tables" className="flex items-center gap-2">
                                <TableIcon className="w-4 h-4" /> Tables
                            </TabsTrigger>
                        </TabsList>

                        {/* --- Вкладка: ГРАФІКИ --- */}
                        <TabsContent value="charts" className="space-y-6">

                            {/* Головні графіки */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <SalesApexChart data={salesChart} />
                                <PnLApexChart data={pnl?.breakdown} />
                            </div>

                            {/* Конверсія + Статистика по людях */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <ConversionApexChart data={conversion} />
                                <PeopleStatsApexChart title="Top Managers" data={managersStats} />
                                <PeopleStatsApexChart title="Top Clients" data={clientsStats} />
                                <PeopleStatsApexChart title="Top Translators" data={translatorsStats} />
                            </div>

                            {/* Проблемні замовлення */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <OrdersApexChart title="Unpaid Orders" data={unpaidOrders} color="#f59e0b" /> {/* Жовтий */}
                                <OrdersApexChart title="Overdue Orders" data={overduePayments} color="#ef4444" /> {/* Червоний */}
                                <OrdersApexChart title="High Risk Orders" data={highRiskOrders} color="#8b5cf6" /> {/* Фіолетовий */}
                            </div>

                        </TabsContent>

                        {/* --- Вкладка: ТАБЛИЦІ --- */}
                        <TabsContent value="tables" className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <OrdersMiniTable title="Unpaid" data={unpaidOrders} />
                                <OrdersMiniTable title="Overdue" data={overduePayments} />
                                <OrdersMiniTable title="High Risk" data={highRiskOrders} />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <StatsTable title="Managers" data={managersStats} />
                                <StatsTable title="Clients" data={clientsStats} />
                                <StatsTable title="Translators" data={translatorsStats} />
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Conversion</CardTitle>
                                </CardHeader>
                                <CardContent className="flex gap-6">
                                    <div>Total: {conversion?.total_requests}</div>
                                    <div>Accepted: {conversion?.accepted_services}</div>
                                    <div>Rejected: {conversion?.refused_services}</div>
                                    <div>%: {conversion?.conversion_percent}</div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>All Orders</CardTitle>
                                    <CardDescription>Recent orders from the system</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {(Array.isArray(ownerOrders) ? ownerOrders : (ownerOrders as any)?.results || []).slice(0, 10).map((o: any) => (
                                            <div key={o.id} className="flex justify-between text-sm py-2 border-b last:border-0">
                                                <div className="flex gap-4">
                                                    <span className="font-medium">#{o.id}</span>
                                                    <span className="text-muted-foreground">{o.title || "No Title"}</span>
                                                </div>
                                                <div className="flex gap-4">
                                                    <span className="text-muted-foreground">{o.created_at?.split('T')[0]}</span>
                                                    <span className="font-medium">${o.total_amount || 0}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                        </TabsContent>
                    </Tabs>

                </div>
            </main>
        </>
    )
}


function SalesApexChart({ data }: { data: SalesChartItem[] }) {
    if (!data || data.length === 0) return <Card><CardHeader><CardTitle>Sales Chart</CardTitle></CardHeader><CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">Немає даних</CardContent></Card>;

    const options: any = {
        chart: {
            type: 'line',
            fontFamily: 'Inter, sans-serif',
            toolbar: { show: true },
            zoom: { enabled: true, allowMouseWheelZoom: false },
            animations: { enabled: true }
        },
        colors: ['#3b82f6'], // Синій як в SessionsByDayChart
        stroke: { curve: 'smooth', width: 3 },
        markers: {
            size: 5,
            colors: ['#3b82f6'],
            strokeColors: '#ffffff',
            strokeWidth: 2,
            hover: { size: 7 }
        },
        grid: {
            borderColor: '#e0e0e0',
            strokeDashArray: 4,
            xaxis: { lines: { show: true } },
            yaxis: { lines: { show: true } }
        },
        xaxis: {
            categories: data.map(item => item.date),
            labels: {
                rotate: -45,
                style: { colors: "#6b7280", fontSize: '11px', fontFamily: 'Inter, sans-serif' }
            }
        },
        yaxis: {
            labels: { formatter: (val: number) => `$${val}`, style: { colors: "#6b7280", fontSize: '11px', fontFamily: 'Inter, sans-serif' } }
        },
        tooltip: { theme: 'light', y: { formatter: (val: number) => `$${val}` } },
        dataLabels: { enabled: false },
        responsive: commonResponsiveConfig
    };
    const series = [{ name: 'Revenue', data: data.map(item => item.daily_revenue) }];

    return (
        <Card>
            <CardHeader><CardTitle>Динаміка продажів</CardTitle></CardHeader>
            <CardContent><Chart options={options} series={series} type="line" height={320} /></CardContent>
        </Card>
    );
}

function PnLApexChart({ data }: { data: PnLBreakdownItem[] | undefined }) {
    if (!data || data.length === 0) return <Card><CardHeader><CardTitle>PnL Breakdown</CardTitle></CardHeader><CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">Немає даних</CardContent></Card>;

    const options: any = {
        chart: { type: 'bar', fontFamily: 'Inter, sans-serif', toolbar: { show: true } },
        plotOptions: { bar: { borderRadius: 4, columnWidth: '40%' } },
        colors: ['#10b981'],
        grid: {
            borderColor: '#e0e0e0',
            strokeDashArray: 4,
            xaxis: { lines: { show: true } },
            yaxis: { lines: { show: true } }
        },
        xaxis: {
            categories: data.map(item => item.name || "Unknown"),
            labels: { rotate: -45, style: { colors: "#6b7280", fontSize: '11px', fontFamily: 'Inter, sans-serif' } }
        },
        yaxis: {
            labels: { formatter: (val: number) => `$${val}`, style: { colors: "#6b7280", fontSize: '11px', fontFamily: 'Inter, sans-serif' } }
        },
        dataLabels: { enabled: false },
        tooltip: { theme: 'light', y: { formatter: (val: number) => `$${val}` } },
        responsive: commonResponsiveConfig
    };
    const series = [{ name: 'Прибуток', data: data.map(item => item.val_profit) }];

    return (
        <Card>
            <CardHeader><CardTitle>Прибуток за категоріями</CardTitle></CardHeader>
            <CardContent><Chart options={options} series={series} type="bar" height={320} /></CardContent>
        </Card>
    );
}

function ConversionApexChart({ data }: { data: ConversionStats | null }) {
    if (!data) return <Card><CardHeader><CardTitle>Conversion</CardTitle></CardHeader><CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">Немає даних</CardContent></Card>;

    const options: any = {
        chart: {
            type: 'donut',
            fontFamily: 'Inter, sans-serif',
            toolbar: { show: true },
            zoom: { enabled: true, allowMouseWheelZoom: false }
        },
        labels: ['Accepted', 'Rejected'],
        colors: ['#10b981', '#ef4444'], // Зелений, Червоний
        dataLabels: { enabled: false },
        plotOptions: {
            pie: {
                donut: {
                    labels: {
                        show: true,
                        name: { show: true },
                        value: { show: true, formatter: (val: string) => val },
                        total: { show: true, label: 'Total', formatter: () => data.total_requests }
                    }
                }
            }
        },
        legend: { position: 'bottom' },
        responsive: [
            {
                breakpoint: 480,
                options: { chart: { width: 300 }, legend: { position: 'bottom' } }
            }
        ]
    };
    const series = [data.accepted_services, data.refused_services];

    return (
        <Card>
            <CardHeader><CardTitle>Conversion ({data.conversion_percent}%)</CardTitle></CardHeader>
            <CardContent className="flex justify-center">
                <Chart options={options} series={series} type="donut" height={320} />
            </CardContent>
        </Card>
    )
}

function PeopleStatsApexChart({ title, data }: { title: string, data: StatsItem[] }) {
    if (!data || data.length === 0) return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">Немає даних</CardContent></Card>;

    const chartData = data.slice(0, 5);
    const options: any = {
        chart: { type: 'bar', toolbar: { show: true }, fontFamily: 'Inter, sans-serif' },
        plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '50%' } },
        colors: ['#8b5cf6'], // Фіолетовий
        dataLabels: { enabled: false },
        grid: {
            borderColor: '#e0e0e0',
            strokeDashArray: 4,
            xaxis: { lines: { show: true } },
            yaxis: { lines: { show: true } }
        },
        xaxis: {
            labels: { style: { colors: "#6b7280", fontSize: '11px', fontFamily: 'Inter, sans-serif' } }
        },
        yaxis: {
            categories: chartData.map(item => item.full_name || 'Unknown'),
            labels: { style: { colors: "#6b7280", fontSize: '12px', fontWeight: 500, fontFamily: 'Inter, sans-serif' } }
        },
        tooltip: { theme: 'light', y: { formatter: (val: number) => `$${val}` } },
        responsive: commonResponsiveConfig
    };
    const series = [{ name: 'Revenue', data: chartData.map(item => item.total_revenue) }];

    return (
        <Card>
            <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
            <CardContent>
                <Chart options={options} series={series} type="bar" height={320} />
            </CardContent>
        </Card>
    )
}

function OrdersApexChart({ title, data, color }: { title: string, data: Order[], color: string }) {
    if (!data || data.length === 0) return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">Немає даних</CardContent></Card>;

    const chartData = data.slice(0, 5);
    const options: any = {
        chart: { type: 'bar', toolbar: { show: true }, fontFamily: 'Inter, sans-serif' },
        plotOptions: { bar: { borderRadius: 4, columnWidth: '40%' } },
        colors: [color],
        dataLabels: { enabled: false },
        grid: {
            borderColor: '#e0e0e0',
            strokeDashArray: 4,
            xaxis: { lines: { show: true } },
            yaxis: { lines: { show: true } }
        },
        xaxis: {
            categories: chartData.map(item => `#${item.id}`),
            labels: { rotate: -45, style: { colors: "#6b7280", fontSize: '11px', fontWeight: 500, fontFamily: 'Inter, sans-serif' } }
        },
        yaxis: {
            labels: { formatter: (val: number) => `$${val}`, style: { colors: "#6b7280", fontSize: '11px', fontFamily: 'Inter, sans-serif' } }
        },
        tooltip: { theme: 'light', y: { formatter: (val: number) => `$${val}` } },
        responsive: commonResponsiveConfig
    };
    const series = [{ name: 'Amount', data: chartData.map(item => item.total_amount || 0) }];

    return (
        <Card>
            <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
            <CardContent>
                <Chart options={options} series={series} type="bar" height={320} />
            </CardContent>
        </Card>
    )
}

function KpiCard({ title, value }: { title: string; value?: number }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value !== undefined ? `$${value}` : '-'}</div>
            </CardContent>
        </Card>
    )
}

function OrdersMiniTable({ title, data }: { title: string; data: Order[] }) {
    return (
        <Card>
            <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
                {data.slice(0, 5).map((o) => (
                    <div key={o.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                        <span className="text-muted-foreground">#{o.id}</span>
                        <span>{o.deadline}</span>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

function StatsTable({ title, data }: { title: string; data: StatsItem[] }) {
    return (
        <Card>
            <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
                {data.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1 border-b last:border-0">
                        <span className="truncate pr-2">{item.full_name}</span>
                        <span className="font-medium whitespace-nowrap">${item.total_revenue}</span>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}