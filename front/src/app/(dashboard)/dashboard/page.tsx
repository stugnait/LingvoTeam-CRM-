"use client"

import {useState, useEffect, Suspense} from "react"
import { useSearchParams } from "next/navigation"
import { useMe } from "@/src/features/auth/hooks/useMe"
import { apiFetch } from "@/src/shared/api/client"
import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"
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
import dynamic from "next/dynamic"
import {
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
    Star,
    ArrowRight,
    BarChart3
} from "lucide-react"

// Інтерфейси ...
interface PnlData { revenue: number; cogs: number; net_profit: number; gross_margin_percent: number; avg_order_value: number; }
interface SalesChartData { date: string; daily_revenue: number; }
interface ManagerData { id: number; full_name: string; total_revenue: number; total_orders: number; avg_order_value: number; }
interface TranslatorData { id: number; full_name: string; avg_rating: number; total_orders: number; revision_count: number; }
interface EditorData { id: number; full_name: string; total_checked: number; }
interface LanguageData { pair_name: string; total_orders: number; total_revenue: number; avg_order_value: number; }

interface DashboardData {
    pnl: PnlData;
    salesChart: SalesChartData[];
    managers: ManagerData[];
    translators: TranslatorData[];
    editors: EditorData[];
    languages: LanguageData[];
}

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false })
function DashboardPage() {
    const { role, loading } = useMe()
    const userRole = String(role)
    const searchParams = useSearchParams()

    const currentTab = searchParams.get("tab") || "finance"

    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
    const [isLoadingData, setIsLoadingData] = useState<boolean>(true)

    useEffect(() => {
        let isMounted = true;

        const fetchDashboardData = async () => {
            if (userRole !== "admin" && userRole !== "financier") {
                setIsLoadingData(false);
                return;
            }

            const endDateObj = new Date();
            const startDateObj = new Date();
            startDateObj.setDate(endDateObj.getDate() - 30);

            const endDate = endDateObj.toISOString().split('T')[0];
            const startDate = startDateObj.toISOString().split('T')[0];

            try {
                const [
                    pnlData, salesData, managersData, translatorsData, editorsData, languagesData
                ] = await Promise.all([
                    apiFetch<any>(`stats/pnl/?start_date=${startDate}&end_date=${endDate}`, { method: "GET" }),
                    apiFetch<any>(`stats/dashboard/sales-chart/?start_date=${startDate}&end_date=${endDate}`, { method: "GET" }),
                    apiFetch<any>(`stats/dashboard/managers-stats/?start_date=${startDate}&end_date=${endDate}`, { method: "GET" }),
                    apiFetch<any>(`stats/dashboard/translators-stats/?start_date=${startDate}&end_date=${endDate}`, { method: "GET" }),
                    apiFetch<any>(`stats/dashboard/editors-stats/?start_date=${startDate}&end_date=${endDate}`, { method: "GET" }),
                    apiFetch<any>(`stats/dashboard/language-pairs-stats/?start_date=${startDate}&end_date=${endDate}`, { method: "GET" })
                ]);

                if (isMounted) {
                    setDashboardData({
                        pnl: {
                            revenue: Number(pnlData?.summary?.revenue || 0),
                            cogs: Number(pnlData?.summary?.cogs || 0),
                            net_profit: Number(pnlData?.summary?.net_profit || 0),
                            gross_margin_percent: Number(pnlData?.summary?.gross_margin_percent || 0),
                            avg_order_value: Number(pnlData?.summary?.avg_order_value || 0)
                        },
                        salesChart: salesData || [],
                        managers: managersData || [],
                        translators: translatorsData || [],
                        editors: editorsData || [],
                        languages: languagesData || []
                    });
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                if (isMounted) {
                    setIsLoadingData(false);
                }
            }
        };

        fetchDashboardData();

        return () => { isMounted = false; };
    }, [userRole]);

    if (loading) {
        return (
            <>
                <DashboardHeader />
                <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
                    <p className="text-muted-foreground animate-pulse">Loading...</p>
                </main>
            </>
        )
    }

    if (userRole === "editor") {
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
                <DashboardHeader />
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="mx-auto max-w-7xl space-y-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <Card className="md:col-span-2">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Average Proofreading Time</CardTitle>
                                    <Timer className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-semibold">{editorStats.avgSpeed}</div>
                                    <p className="text-sm text-muted-foreground mt-1">Per 1000 characters</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Backlog</CardTitle>
                                    <ListChecks className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-semibold">{editorStats.backlogCount}</div>
                                    <p className="text-sm text-muted-foreground mt-1">Orders in &apos;Editing&apos; status</p>
                                </CardContent>
                            </Card>

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
                                                        <span className="text-xs text-muted-foreground">{order.priority} Priority</span>
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

    if (userRole === "manager") {
        const stats = {
            inProgress: 14,
            overdue: 2,
            deadlineSoon: 5,
            financialPipeline: 3450.50,
            totalRevenue: 128400.00
        }

        return (
            <>
                <DashboardHeader />
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="mx-auto max-w-7xl space-y-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

    if (userRole === "admin"|| userRole === "financier" ) {

        if (isLoadingData || !dashboardData) {
            return (
                <>
                    <DashboardHeader />
                    <main className="flex-1 p-6 flex items-center justify-center">
                        <p className="text-muted-foreground animate-pulse">Завантаження аналітики...</p>
                    </main>
                </>
            )
        }

        const { pnl, salesChart, managers, translators, editors, languages } = dashboardData
        const salesSeries = [
            { name: 'Дохід', data: salesChart?.map((d: SalesChartData) => d.daily_revenue) || [] }
        ]
        const salesOptions: ApexCharts.ApexOptions = {
            chart: { type: 'area', fontFamily: 'ui-sans-serif, system-ui, sans-serif', zoom: { enabled: true, allowMouseWheelZoom: false, autoScaleYaxis: true }, toolbar: { show: true }, animations: { enabled: true } },
            colors: ['#8b5cf6'],
            grid: { borderColor: '#f2f5f7', strokeDashArray: 3, },
            dataLabels: { enabled: false }, fill: { type: 'solid', opacity: 0.5 },
            tooltip: { theme: 'light', shared: true, intersect: false, y: { formatter: (val) => val !== undefined ? `$${val.toLocaleString()}` : '-' } },
            stroke: { curve: 'smooth', width: 3, lineCap: 'round' },
            markers: { size: 5, colors: ['#8b5cf6'], strokeColors: '#fff', strokeWidth: 2, hover: { size: 7 } },
            xaxis: {
                categories: salesChart?.map((d: SalesChartData) => d.date) || [], type: 'category', tickAmount: 10,
                labels: { style: { colors: "#8c9097", fontSize: '11px', fontWeight: 600 }, rotate: -45, formatter: function(val) { if (!val) return ''; const date = new Date(String(val)); if (!isNaN(date.getTime())) return date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' }); return String(val); } },
                axisBorder: { show: false }, axisTicks: { show: false },
            },
            yaxis: { axisBorder: { show: false }, axisTicks: { show: false }, labels: { show: true, style: { colors: "#8c9097", fontSize: '11px' }, formatter: (val) => `$${val.toLocaleString()}` } }
        }

        const managerSeries = [{ name: 'Принесений дохід', data: managers?.map((m: ManagerData) => m.total_revenue) || [] }]
        const managerOptions: ApexCharts.ApexOptions = {
            chart: { type: 'bar', fontFamily: 'ui-sans-serif, system-ui, sans-serif', toolbar: { show: false } },
            colors: ['#10b981'],
            plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '50%' } },
            dataLabels: { enabled: false },
            grid: { borderColor: '#e5e7eb', strokeDashArray: 5, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } }, padding: { top: 0, right: 20, bottom: 0, left: 15 } },
            xaxis: { categories: managers?.map((m: ManagerData) => m.full_name) || [], labels: { style: { colors: "#8c9097", fontSize: '11px' }, formatter: (val) => `$${Number(val).toLocaleString()}` }, axisBorder: { show: false }, axisTicks: { show: false }, },
            yaxis: { labels: { style: { colors: "#4b5563", fontSize: '12px', fontWeight: 500 } } },
            tooltip: { theme: 'light', y: { formatter: (val) => `$${val.toLocaleString()}` } }
        }

        return (
            <>
                <DashboardHeader />
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="mx-auto max-w-7xl space-y-8 pb-10">
                        {currentTab === "finance" && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-semibold">Фінансові показники (P&L)</h2>
                                        <p className="text-sm text-muted-foreground mt-1">Огляд ключових показників P&L.</p>
                                    </div>
                                    <Link href="/dashboard/pnl" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                                        Перейти до аналітики <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>

                                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Загальний дохід</CardTitle>
                                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-semibold">${pnl.revenue.toLocaleString()}</div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Собівартість (COGS)</CardTitle>
                                            <TrendingDown className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-semibold">${pnl.cogs.toLocaleString()}</div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Чистий прибуток</CardTitle>
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-semibold">${pnl.net_profit.toLocaleString()}</div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Маржинальність</CardTitle>
                                            <Percent className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-semibold">{pnl.gross_margin_percent}%</div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Середній чек</CardTitle>
                                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-semibold">${pnl.avg_order_value}</div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <BarChart3 className="h-4 w-4" /> Динаміка продажів
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[350px] w-full relative">
                                            <ReactApexChart
                                                options={salesOptions}
                                                series={salesSeries}
                                                type="area"
                                                height="100%"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                        {currentTab === "team" && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-semibold">Ефективність команди</h2>
                                        <p className="text-sm text-muted-foreground mt-1">Показники менеджерів, перекладачів та редакторів.</p>
                                    </div>
                                    <Link href="/dashboard/team" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                                        Перейти до аналітики <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>

                                <div className="grid gap-6 lg:grid-cols-2">
                                    <Card className="lg:col-span-2">
                                        <CardHeader>
                                            <CardTitle className="text-base">Дохід по менеджерах</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="h-[250px] w-full relative">
                                                <ReactApexChart
                                                    options={managerOptions}
                                                    series={managerSeries}
                                                    type="bar"
                                                    height="100%"
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="lg:col-span-2">
                                        <CardHeader className="border-b py-4">
                                            <CardTitle className="text-base font-semibold">Менеджери</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="text-xs">Ім&apos;я</TableHead>
                                                        <TableHead className="text-right text-xs">Дохід</TableHead>
                                                        <TableHead className="text-right text-xs">Замовлення</TableHead>
                                                        <TableHead className="text-right text-xs">Сер. чек</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {managers?.map((manager) => (
                                                        <TableRow key={manager.id}>
                                                            <TableCell className="font-medium">{manager.full_name}</TableCell>
                                                            <TableCell className="text-right">${manager.total_revenue?.toLocaleString()}</TableCell>
                                                            <TableCell className="text-right">{manager.total_orders}</TableCell>
                                                            <TableCell className="text-right">${manager.avg_order_value}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="border-b py-4">
                                            <CardTitle className="text-base font-semibold">Перекладачі</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="text-xs">Ім&apos;я</TableHead>
                                                        <TableHead className="text-center text-xs">Рейтинг</TableHead>
                                                        <TableHead className="text-right text-xs">Замовлення</TableHead>
                                                        <TableHead className="text-right text-xs">Доопрацювання</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {translators?.map((translator) => (
                                                        <TableRow key={translator.id}>
                                                            <TableCell className="font-medium">{translator.full_name}</TableCell>
                                                            <TableCell className="text-center">
                                                                <div className="flex items-center justify-center gap-1 text-sm">
                                                                    {translator.avg_rating} <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">{translator.total_orders}</TableCell>
                                                            <TableCell className="text-right text-destructive">{translator.revision_count}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="border-b py-4">
                                            <CardTitle className="text-base font-semibold">Редактори</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="text-xs">Ім&apos;я</TableHead>
                                                        <TableHead className="text-right text-xs">Перевірено</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {editors?.map((editor) => (
                                                        <TableRow key={editor.id}>
                                                            <TableCell className="font-medium">{editor.full_name}</TableCell>
                                                            <TableCell className="text-right">{editor.total_checked}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}
                        {currentTab === "clients" && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-semibold">Аналітика клієнтів та мов</h2>
                                        <p className="text-sm text-muted-foreground mt-1">Популярні мовні пари та прибуток по них.</p>
                                    </div>
                                    <Link href="/dashboard/clients-analytics" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                                        Перейти до аналітики <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>

                                <Card>
                                    <CardHeader className="border-b py-4">
                                        <CardTitle className="text-base font-semibold">Мовні пари</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="text-xs">Мовна пара</TableHead>
                                                    <TableHead className="text-right text-xs">Замовлення</TableHead>
                                                    <TableHead className="text-right text-xs">Дохід</TableHead>
                                                    <TableHead className="text-right text-xs">Сер. чек</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {languages?.map((lang, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-medium">{lang.pair_name}</TableCell>
                                                        <TableCell className="text-right">{lang.total_orders}</TableCell>
                                                        <TableCell className="text-right text-emerald-600 font-medium">${lang.total_revenue?.toLocaleString()}</TableCell>
                                                        <TableCell className="text-right text-muted-foreground">${lang.avg_order_value}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                    </div>
                </main>
            </>
        )
    }
    return (
        <>
            <DashboardHeader />
            <main className="flex-1 p-6 flex items-center justify-center">
                <p className="text-muted-foreground">Оновіть сторінку або перевірте права доступу.</p>
            </main>
        </>
    )
}

export default function Page() {
    return (
        <Suspense fallback={<div className="p-6 text-muted-foreground">Завантаження...</div>}>
            <DashboardPage />
        </Suspense>
    )
}