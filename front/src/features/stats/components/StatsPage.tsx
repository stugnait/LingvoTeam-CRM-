"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"
import { useStats } from "../hooks/useStats"

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/src/components/ui/card"

import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"

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

    const [dates, setDates] = useState({
        start_date: "",
        end_date: "",
    })

    // initial load
    useEffect(() => {
        fetchUnpaidOrders()
        fetchOverduePayments()
        fetchHighRiskOrders()
    }, [])

    const loadAnalytics = () => {
        fetchConversion(dates)
        fetchSalesChart(dates)
        fetchManagersStats(dates)
        fetchClientsStats(dates)
        fetchTranslatorsStats(dates)
        fetchPnL({ ...dates })
    }

    return (
        <>
            <DashboardHeader />

            <main className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-7xl space-y-6">

                    {/* HEADER */}
                    <div>
                        <h2 className="text-2xl font-bold">Statistics Dashboard</h2>
                        <p className="text-muted-foreground">
                            Business insights and financial analytics
                        </p>
                    </div>

                    {/* DATE FILTER */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Filters</CardTitle>
                            <CardDescription>Select period</CardDescription>
                        </CardHeader>
                        <CardContent className="flex gap-4">
                            <Input
                                type="date"
                                value={dates.start_date}
                                onChange={(e) =>
                                    setDates(prev => ({
                                        ...prev,
                                        start_date: e.target.value
                                    }))
                                }
                            />

                            <Input
                                type="date"
                                value={dates.end_date}
                                onChange={(e) =>
                                    setDates(prev => ({
                                        ...prev,
                                        end_date: e.target.value
                                    }))
                                }
                            />

                            <Button onClick={loadAnalytics}>
                                Load
                            </Button>
                        </CardContent>
                    </Card>

                    {/* KPI CARDS */}
                    <div className="grid grid-cols-4 gap-4">
                        <KpiCard
                            title="Revenue"
                            value={pnl?.summary.revenue}
                        />
                        <KpiCard
                            title="Profit"
                            value={pnl?.summary.net_profit}
                        />
                        <KpiCard
                            title="Margin %"
                            value={pnl?.summary.gross_margin_percent}
                        />
                        <KpiCard
                            title="OPEX"
                            value={pnl?.summary.opex}
                        />
                    </div>

                    {/* ALERT TABLES */}
                    <div className="grid grid-cols-3 gap-4">
                        <OrdersMiniTable title="Unpaid" data={unpaidOrders} />
                        <OrdersMiniTable title="Overdue" data={overduePayments} />
                        <OrdersMiniTable title="High Risk" data={highRiskOrders} />
                    </div>

                    {/* STATS TABLES */}
                    <div className="grid grid-cols-3 gap-4">
                        <StatsTable title="Managers" data={managersStats} />
                        <StatsTable title="Clients" data={clientsStats} />
                        <StatsTable title="Translators" data={translatorsStats} />
                    </div>

                    {/* CONVERSION */}
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

                    {/* SALES */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Sales Chart</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {salesChart.map((item, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                    <span>{item.date}</span>
                                    <span>{item.daily_revenue}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* PnL Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle>PnL Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {pnl?.breakdown.map((b, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                    <span>{b.name}</span>
                                    <span>{b.val_profit}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                </div>
            </main>
        </>
    )
}

function KpiCard({ title, value }: { title: string; value?: number }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {value ?? 0}
                </div>
            </CardContent>
        </Card>
    )
}

function OrdersMiniTable({ title, data }: { title: string; data: any[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {data.slice(0, 5).map((o) => (
                    <div key={o.id} className="flex justify-between text-sm">
                        <span>#{o.id}</span>
                        <span>{o.deadline}</span>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

function StatsTable({ title, data }: { title: string; data: any[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {data.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                        <span>{item.name}</span>
                        <span>{item.total_revenue}</span>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}