"use client"

import { useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"
import { useStats } from "../hooks/useStats"

import { PeriodSelector } from "@/src/components/ui/PeriodSelector"
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

export function StatsPage() {
    const {
        loading,

        unpaidOrders,
        overduePayments,
        highRiskOrders,

        conversion,
        salesChart,

        managersStats,
        clientsStats,
        translatorsStats,

        pnl,

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

    // initial load для загальних даних
    useEffect(() => {
        fetchUnpaidOrders()
        fetchOverduePayments()
        fetchHighRiskOrders()
    }, [])

    const handlePeriodChange = useCallback((periodValue: string) => {
        let params: any = {}

        if (periodValue.includes(' - ')) {
            const [start, end] = periodValue.split(' - ')

            const formatForApi = (dateStr: string) => {
                const [d, m, y] = dateStr.split('-')
                return `${y}-${m}-${d}`
            }

            params = {
                start_date: formatForApi(start),
                end_date: formatForApi(end)
            }
        }
        else if (periodValue.startsWith('Початок: ')) {
            const start = periodValue.replace('Початок: ', '')
            const [d, m, y] = start.split('-')
            params = {
                start_date: `${y}-${m}-${d}`,
                end_date: ""
            }
        }
        else {
            params = { period: periodValue }
        }

        fetchConversion(params)
        fetchSalesChart(params)
        fetchManagersStats(params)
        fetchClientsStats(params)
        fetchTranslatorsStats(params)
        fetchPnL(params)

    }, [
        fetchConversion, fetchSalesChart, fetchManagersStats,
        fetchClientsStats, fetchTranslatorsStats, fetchPnL
    ])

    return (
        <>
            <DashboardHeader />

            <main className="flex-1 overflow-y-auto p-3 sm:p-6">
                <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
                        <div>
                            <h2 className="text-2xl font-bold">Statistics Dashboard</h2>
                            <p className="text-muted-foreground">
                                Business insights and financial analytics
                            </p>
                        </div>
                    </div>

                    {/* DATE FILTER */}
                    <Card className="relative z-50 overflow-visible">
                        <CardHeader>
                            <CardTitle>Filters</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PeriodSelector onPeriodChange={handlePeriodChange} />
                        </CardContent>
                    </Card>

                    {/* KPI CARDS */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                        <KpiCard title="Revenue" value={pnl?.summary.revenue} />
                        <KpiCard title="Profit" value={pnl?.summary.net_profit} />
                        <KpiCard title="Margin %" value={pnl?.summary.gross_margin_percent} />
                        <KpiCard title="OPEX" value={pnl?.summary.opex} />
                    </div>

                    <Tabs defaultValue="charts" className="space-y-6">
                        <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
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
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <OrdersMiniTable title="Unpaid" data={unpaidOrders} />
                                <OrdersMiniTable title="Overdue" data={overduePayments} />
                                <OrdersMiniTable title="High Risk" data={highRiskOrders} />
                            </div>

                            {/* STATS TABLES */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <StatsTable title="Managers" data={managersStats} />
                                <StatsTable title="Clients" data={clientsStats} />
                                <StatsTable title="Translators" data={translatorsStats} />
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Conversion</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-wrap gap-4 sm:gap-6">
                                    <div>Total: {conversion?.total_requests}</div>
                                    <div>Accepted: {conversion?.accepted_services}</div>
                                    <div>Rejected: {conversion?.refused_services}</div>
                                    <div>%: {conversion?.conversion_percent}</div>
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
        chart: { type: 'line', fontFamily: 'Inter, sans-serif', toolbar: { show: false } },
        colors: ['#845adf'],
        stroke: { curve: 'smooth', width: 4, lineCap: 'round' },
        markers: { size: 6, strokeWidth: 0, hover: { size: 8 } },
        grid: { borderColor: 'rgba(0, 0, 0, 0.05)', strokeDashArray: 3 },
        xaxis: { categories: data.map(item => item.date), labels: { style: { colors: "#6b7280", fontSize: '11px' } } },
        yaxis: { labels: { formatter: (val: number) => `$${val}`, style: { colors: "#6b7280", fontSize: '11px' } } },
        tooltip: { theme: 'light', y: { formatter: (val: number) => `$${val}` } },
        dataLabels: { enabled: false }
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
        chart: { type: 'bar', fontFamily: 'Inter, sans-serif', toolbar: { show: false } },
        plotOptions: { bar: { borderRadius: 4, columnWidth: '40%' } },
        colors: ['#10b981'],
        grid: { borderColor: 'rgba(0, 0, 0, 0.05)', strokeDashArray: 3 },
        xaxis: { categories: data.map(item => item.name || "Unknown"), labels: { style: { colors: "#6b7280", fontSize: '11px' } } },
        yaxis: { labels: { formatter: (val: number) => `$${val}`, style: { colors: "#6b7280", fontSize: '11px' } } },
        dataLabels: { enabled: false },
        tooltip: { theme: 'light', y: { formatter: (val: number) => `$${val}` } }
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
        chart: { type: 'donut', fontFamily: 'Inter, sans-serif' },
        labels: ['Accepted', 'Rejected'],
        colors: ['#10b981', '#ef4444'], // Зелений для прийнятих, червоний для відхилених
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
        legend: { position: 'bottom' }
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

    const chartData = data.slice(0, 5); // Беремо топ 5
    const options: any = {
        chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
        plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '50%' } },
        colors: ['#845adf'],
        dataLabels: { enabled: false },
        xaxis: {
            categories: chartData.map(item => item.full_name || 'Unknown'),
            labels: { style: { colors: "#6b7280", fontSize: '11px' } }
        },
        yaxis: { labels: { style: { colors: "#111827", fontSize: '12px', fontWeight: 500 } } },
        grid: { borderColor: 'rgba(0,0,0,0.05)', strokeDashArray: 3 },
        tooltip: { theme: 'light', y: { formatter: (val: number) => `$${val}` } }
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

    const chartData = data.slice(0, 5); // Беремо топ 5 замовлень
    const options: any = {
        chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
        plotOptions: { bar: { borderRadius: 4, columnWidth: '40%' } },
        colors: [color],
        dataLabels: { enabled: false },
        xaxis: {
            categories: chartData.map(item => `#${item.id}`),
            labels: { style: { colors: "#6b7280", fontSize: '11px', fontWeight: 500 } }
        },
        yaxis: { labels: { formatter: (val: number) => `$${val}`, style: { colors: "#6b7280", fontSize: '11px' } } },
        grid: { borderColor: 'rgba(0,0,0,0.05)', strokeDashArray: 3 },
        tooltip: { theme: 'light', y: { formatter: (val: number) => `$${val}` } }
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