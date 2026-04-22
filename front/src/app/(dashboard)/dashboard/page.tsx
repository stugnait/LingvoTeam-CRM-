"use client"

import { useMe } from "@/src/features/auth/hooks/useMe"
import { CrmHeader } from "@/src/components/dashboard/crm-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/src/components/ui/table"
import Link from "next/link"
import {
    Users,
    Languages,
    Clock,
    Briefcase,
    AlertTriangle,
    Wallet,
    BadgeDollarSign,
    Timer,
    ListChecks,
    Flame,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Percent,
    ShoppingCart,
    ArrowUpRight,
    Star,
    FileCheck,
    ArrowRight
} from "lucide-react"

export default function DashboardPage() {
    const { role, loading } = useMe()

    if (loading) {
        return (
            <>
                <CrmHeader title="Dashboard" />
                <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
                    <p className="text-muted-foreground animate-pulse">Loading...</p>
                </main>
            </>
        )
    }

    // ==========================================
    // --- 1. EDITOR DASHBOARD ---
    // ==========================================
    if ((role as string) === "editor") {
        const editorStats = {
            backlogCount: 8,
            avgSpeed: "18 min",
            priorityOrders: [
                { id: "ORD-721", client: "Global Tech", deadline: "In 2 hours", priority: "High" },
                { id: "ORD-725", client: "Legal Pro", deadline: "In 5 hours", priority: "Medium" },
                { id: "ORD-730", client: "Health Care", deadline: "Tomorrow", priority: "Low" },
            ]
        }

        return (
            <>
                <CrmHeader title="Editor Dashboard" />
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="mx-auto max-w-7xl space-y-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                            {/* Avg. Proofreading Time */}
                            <Card className="md:col-span-2">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Average Proofreading Time</CardTitle>
                                    <Timer className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-semibold">
                                        {editorStats.avgSpeed}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">Per 1000 characters</p>
                                </CardContent>
                            </Card>

                            {/* Backlog */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Backlog</CardTitle>
                                    <ListChecks className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-semibold">{editorStats.backlogCount}</div>
                                    <p className="text-sm text-muted-foreground mt-1">Orders in 'Editing' status</p>
                                </CardContent>
                            </Card>

                            {/* Priority Queue */}
                            <Card className="md:col-span-3">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
                                    <CardTitle className="text-base font-semibold">Priority Queue</CardTitle>
                                    <Flame className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="space-y-4">
                                        {editorStats.priorityOrders.map((order) => (
                                            <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-medium text-sm">{order.id}</span>
                                                    <span className="text-sm text-muted-foreground">{order.client}</span>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="text-sm font-medium flex items-center gap-1.5">
                                                            <Clock className="h-3.5 w-3.5 text-muted-foreground" /> {order.deadline}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {order.priority} Priority
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                        </div>
                    </div>
                </main>
            </>
        )
    }

    // ==========================================
    // --- 2. MANAGER DASHBOARD ---
    // ==========================================
    if ((role as string) === "manager") {
        const stats = {
            inProgress: 14,
            overdue: 2,
            deadlineSoon: 5,
            financialPipeline: 3450.50,
            totalRevenue: 128400.00
        }

        return (
            <>
                <CrmHeader title="Manager Dashboard" />
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="mx-auto max-w-7xl space-y-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                            {/* Total Turnover */}
                            <Card className="md:col-span-2 lg:col-span-2">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Processed Money</CardTitle>
                                    <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-semibold">
                                        ${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">Processed by this manager</p>
                                </CardContent>
                            </Card>

                            {/* Financial Pipeline */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Financial Pipeline</CardTitle>
                                    <Wallet className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-semibold">
                                        ${stats.financialPipeline.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">Unpaid orders</p>
                                </CardContent>
                            </Card>

                            {/* In Progress */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">In Progress Volume</CardTitle>
                                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-semibold">{stats.inProgress}</div>
                                    <p className="text-sm text-muted-foreground mt-1">Orders currently in progress</p>
                                </CardContent>
                            </Card>

                            {/* Upcoming Deadlines */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Deadlines</CardTitle>
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-semibold">{stats.deadlineSoon}</div>
                                    <p className="text-sm text-muted-foreground mt-1">Deadlines approaching soon</p>
                                </CardContent>
                            </Card>

                            {/* Overdue */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Orders</CardTitle>
                                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-semibold">{stats.overdue}</div>
                                    <p className="text-sm text-muted-foreground mt-1">Orders past deadline</p>
                                </CardContent>
                            </Card>

                        </div>
                    </div>
                </main>
            </>
        )
    }

    // ==========================================
    // --- 3. OWNER / ADMIN DASHBOARD ---
    // ==========================================
    if ((role as string) === "admin" || (role as string) === "financier" || (role as string) === "owner") {

        // MOCK DATA
        const pnl = {
            revenue: 125400.00,
            cogs: 48200.00,
            netProfit: 77200.00,
            margin: 61.5,
            aov: 145.20
        }

        const managers = [
            { name: "Alexander M.", revenue: 42000, orders: 120, aov: 350 },
            { name: "Maria K.", revenue: 38500, orders: 95, aov: 405 },
        ]

        const translators = [
            { name: "Irina V.", rating: 4.9, orders: 156, returns: 2 },
            { name: "John Doe", rating: 4.7, orders: 89, returns: 5 },
        ]

        const editors = [
            { name: "Elena G.", checked: 412 },
            { name: "Victor S.", checked: 385 },
        ]

        const languages = [
            { pair: "English → Ukrainian", orders: 450, profit: 32000, aov: 71 },
            { pair: "German → Ukrainian", orders: 120, profit: 15400, aov: 128 },
            { pair: "Ukrainian → Polish", orders: 85, profit: 8200, aov: 96 },
        ]

        return (
            <>
                <CrmHeader title="Owner Dashboard" />
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="mx-auto max-w-7xl space-y-10 pb-10">

                        {/* ========================================================= */}
                        {/* SECTION 1: FINANCIAL METRICS (P&L) */}
                        {/* ========================================================= */}
                        <section className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-semibold">Financial Metrics (P&L)</h2>
                                    <p className="text-sm text-muted-foreground mt-1">Overview of key financial indicators.</p>
                                </div>
                                <Link href="/dashboard/p&l" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                                    Financial Analytics <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-semibold">${pnl.revenue.toLocaleString()}</div>
                                        <p className="text-xs text-muted-foreground mt-1">Total closed orders</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">COGS</CardTitle>
                                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-semibold">${pnl.cogs.toLocaleString()}</div>
                                        <p className="text-xs text-muted-foreground mt-1">Team payouts</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
                                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-semibold">${pnl.netProfit.toLocaleString()}</div>
                                        <p className="text-xs text-muted-foreground mt-1">Revenue minus costs</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Margin</CardTitle>
                                        <Percent className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-semibold">{pnl.margin}%</div>
                                        <p className="text-xs text-muted-foreground mt-1">Profit ratio</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">AOV</CardTitle>
                                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-semibold">${pnl.aov}</div>
                                        <p className="text-xs text-muted-foreground mt-1">Average order value</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* ========================================================= */}
                        {/* SECTION 2: TEAM EFFICIENCY */}
                        {/* ========================================================= */}
                        <section className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-semibold">Team Efficiency</h2>
                                    <p className="text-sm text-muted-foreground mt-1">Performance metrics for managers, translators, and editors.</p>
                                </div>
                                <Link href="/dashboard/team" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                                    Team Analytics <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>

                            <div className="grid gap-6 md:grid-cols-3">
                                {/* Managers */}
                                <Card>
                                    <CardHeader className="border-b py-4">
                                        <CardTitle className="text-base font-semibold">Managers</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="text-xs">Name</TableHead>
                                                    <TableHead className="text-right text-xs">Revenue</TableHead>
                                                    <TableHead className="text-right text-xs">Orders</TableHead>
                                                    <TableHead className="text-right text-xs">AOV</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {managers.map((m) => (
                                                    <TableRow key={m.name}>
                                                        <TableCell className="font-medium text-sm">{m.name}</TableCell>
                                                        <TableCell className="text-right text-sm">${m.revenue.toLocaleString()}</TableCell>
                                                        <TableCell className="text-right text-sm">{m.orders}</TableCell>
                                                        <TableCell className="text-right text-sm text-muted-foreground">${m.aov}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>

                                {/* Translators */}
                                <Card>
                                    <CardHeader className="border-b py-4">
                                        <CardTitle className="text-base font-semibold">Translators</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="text-xs">Name</TableHead>
                                                    <TableHead className="text-center text-xs">Avg Rating</TableHead>
                                                    <TableHead className="text-right text-xs">Orders</TableHead>
                                                    <TableHead className="text-right text-xs">Revisions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {translators.map((t) => (
                                                    <TableRow key={t.name}>
                                                        <TableCell className="font-medium text-sm">{t.name}</TableCell>
                                                        <TableCell className="text-center">
                                                            <div className="flex items-center justify-center gap-1 text-sm">
                                                                {t.rating} <Star className="h-3 w-3 fill-muted-foreground text-muted-foreground" />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right text-sm">{t.orders}</TableCell>
                                                        <TableCell className="text-right text-sm">{t.returns}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>

                                {/* Editors */}
                                <Card>
                                    <CardHeader className="border-b py-4">
                                        <CardTitle className="text-base font-semibold">Editors</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="text-xs">Name</TableHead>
                                                    <TableHead className="text-right text-xs">Checked</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {editors.map((e) => (
                                                    <TableRow key={e.name}>
                                                        <TableCell className="font-medium text-sm">{e.name}</TableCell>
                                                        <TableCell className="text-right text-sm">{e.checked}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* ========================================================= */}
                        {/* SECTION 3: CLIENT ANALYTICS */}
                        {/* ========================================================= */}
                        <section className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-semibold">Client Analytics</h2>
                                    <p className="text-sm text-muted-foreground mt-1">Top language pairs by volume and profit.</p>
                                </div>
                                <Link href="/dashboard/clients-analytics" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                                    Client Analytics <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>

                            <Card>
                                <CardHeader className="border-b py-4">
                                    <CardTitle className="text-base font-semibold">Top Language Pairs</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="py-3 px-4 text-xs">Language Pair</TableHead>
                                                <TableHead className="text-right py-3 px-4 text-xs">Orders Count</TableHead>
                                                <TableHead className="text-right py-3 px-4 text-xs">Profit ($)</TableHead>
                                                <TableHead className="text-right py-3 px-4 text-xs">AOV</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {languages.map((lp) => (
                                                <TableRow key={lp.pair}>
                                                    <TableCell className="font-medium text-sm px-4 py-3">{lp.pair}</TableCell>
                                                    <TableCell className="text-right text-sm px-4 py-3">{lp.orders}</TableCell>
                                                    <TableCell className="text-right text-sm px-4 py-3">${lp.profit.toLocaleString()}</TableCell>
                                                    <TableCell className="text-right text-sm text-muted-foreground px-4 py-3">${lp.aov}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </section>

                    </div>
                </main>
            </>
        )
    }

    // Відкат (fallback)
    return null
}