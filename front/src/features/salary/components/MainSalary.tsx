"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { cn } from "@/src/lib/utils"
import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/src/components/ui/table"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select"
import {
    ChevronLeft,
    ChevronRight,
    Save,
    History,
    AlertCircle,
    Star // Додаємо іконку зірки для оцінки
} from "lucide-react"

import type { User } from "@/src/features/salary/types"
import { useSalaryManagement } from "@/src/features/salary/hooks/useSalary"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

type SalaryDraft = { base_salary: number, bonus: number, premium: number }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(val: number) {
    return new Intl.NumberFormat("uk-UA", {
        style: "currency",
        currency: "UAH",
        maximumFractionDigits: 0,
    }).format(val)
}

function formatMonthYear(date: Date, locale: string) {
    const formatter = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" })
    const formatted = formatter.format(date)
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function getMonthDates(currentDate: Date) {
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const formatYMD = (d: Date) => d.toISOString().split('T')[0]

    return {
        startDate: formatYMD(startDate),
        endDate: formatYMD(endDate)
    }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FinanceTablePage() {
    const { locale, t } = useI18n()
    const dateLocale = locale === "uk" ? "uk-UA" : "en-US"
    const searchParams = useSearchParams()
    const router = useRouter()

    // Повертаємо числові значення ролей
    const activeRole = Number(searchParams.get("role")) || 1
    const isManager = activeRole === 1
    const isEditor = activeRole === 2
    const isTranslator = activeRole === 5

    // Визначаємо підпис для бейджика під іменем
    const getRoleLabel = () => {
        if (isManager) {return t("common.manager")}
        if (isEditor) {return t("common.editor")}
        if (isTranslator) {return t("common.translator")}
        return t("salary.worker")
    }

    const maxMonthDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const [currentMonthDate, setCurrentMonthDate] = useState(() => maxMonthDate)
    const [expandedId, setExpandedId] = useState<number | null>(null)

    const [drafts, setDrafts] = useState<Record<number, SalaryDraft>>({})

    const {
        users,
        usersLoading,
        fetchUsers,
        fetchSalaryList,
        previews,
        previewsLoading,
        fetchAllPreviews,
        saveSalary,
    } = useSalaryManagement({ roleId: activeRole })

    useEffect(() => {
        const loadData = async () => {
            const fetchedUsers = await fetchUsers(activeRole)
            const { startDate, endDate } = getMonthDates(currentMonthDate)

            fetchSalaryList({ role: activeRole, start_date: startDate, end_date: endDate })

            if (fetchedUsers && fetchedUsers.length > 0) {
                fetchAllPreviews(fetchedUsers, startDate, endDate, activeRole)
            }
        }
        loadData()
    }, [activeRole, currentMonthDate])

    const previewDrafts = useMemo<Record<number, SalaryDraft>>(() => {
        const nextDrafts: Record<number, SalaryDraft> = {}

        Object.values(previews).forEach(p => {
            nextDrafts[p.user] = {
                base_salary: Number(p.base_salary) || 0,
                bonus: Number(p.bonus) || 0,
                premium: Number(p.premium) || 0,
            }
        })

        return nextDrafts
    }, [previews])


    const handlePrevMonth = () => setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))

    const handleNextMonth = () => {
        if (currentMonthDate.getTime() >= maxMonthDate.getTime()) {return}
        setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
    }

    const isNextDisabled = currentMonthDate.getTime() >= maxMonthDate.getTime()

    const handleDraftChange = (userId: number, field: string, value: string) => {
        setDrafts(prev => ({
            ...prev,
            [userId]: {
                ...(previewDrafts[userId] || { base_salary: 0, bonus: 0, premium: 0 }),
                ...prev[userId],
                [field]: Number(value) || 0
            }
        }))
    }

    const handleRoleChange = (val: string) => router.push(`?role=${val}`)

    const handleToggleHistory = (userId: number) => {
        if (expandedId === userId) {
            setExpandedId(null)
        } else {
            setExpandedId(userId)
            fetchSalaryList({ user: userId, role: activeRole })
        }
    }

    const handleSaveUserSalary = async (userId: number) => {
        const draft = drafts[userId] ?? previewDrafts[userId]
        if (!draft) {return}
        const { startDate, endDate } = getMonthDates(currentMonthDate)
        await saveSalary(userId, draft, startDate, endDate, activeRole)
    }

    // 8 колонок для менеджера, 11 для перекладача (бо додали оцінку), 10 для редактора
    const colSpanCount = isManager ? 8 : (isTranslator ? 11 : 10);

    return (
        <>
            <DashboardHeader />
            <div className="flex flex-col h-full min-h-screen bg-background p-3 sm:p-6">
                <div className="mb-4 sm:mb-6 mx-1 sm:mx-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{t("salary.title")}</h1>
                        <p className="text-muted-foreground text-sm">{t("salary.description")}</p>
                    </div>
                </div>

                <div className="border border-border rounded-lg bg-card mx-1 sm:mx-4 shadow-soft overflow-hidden">
                    {/* ─── ПАНЕЛЬ ФІЛЬТРІВ ────────────────────────────────────────── */}
                    <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-border bg-muted/10 gap-4">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <Select value={String(activeRole)} onValueChange={handleRoleChange}>
                                <SelectTrigger className="w-full sm:w-[200px] bg-background">
                                    <SelectValue placeholder={t("salary.selectRole")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">{t("common.managers")}</SelectItem>
                                    <SelectItem value="2">{t("common.editors")}</SelectItem>
                                    <SelectItem value="5">{t("common.translators")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center bg-background border border-border rounded-lg shadow-sm overflow-hidden w-full sm:w-auto">
                            <button onClick={handlePrevMonth} className="p-2 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors border-r border-border">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="px-4 py-2 min-w-[160px] text-center font-medium text-sm text-foreground">
                                {formatMonthYear(currentMonthDate, dateLocale)}
                            </div>
                            <button
                                onClick={handleNextMonth}
                                disabled={isNextDisabled}
                                className={cn("p-2 transition-colors border-l border-border", isNextDisabled ? "text-muted-foreground/30 bg-muted/20 cursor-not-allowed" : "hover:bg-muted/50 text-muted-foreground hover:text-foreground")}
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* ─── ТАБЛИЦЯ ─────────────────────────────────────────────────── */}
                    <div className="overflow-x-auto">
                        <Table className="w-full min-w-[1200px]">
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="font-semibold text-foreground h-14 pl-6 w-[200px]">{t("salary.employee")}</TableHead>
                                    {isManager ? (
                                        <>
                                            <TableHead className="font-semibold text-foreground h-14">{t("salary.ordersAllOverdue")}</TableHead>
                                            <TableHead className="font-semibold text-foreground h-14">{t("salary.revenueMargin")}</TableHead>
                                        </>
                                    ) : (
                                        <>
                                            <TableHead className="font-semibold text-foreground h-14">{t("common.orders")}</TableHead>
                                            <TableHead className="font-semibold text-foreground h-14">{t("salary.revenue")} {isEditor && `/ ${t("orders.margin").replace(":", "").toLowerCase()}`}</TableHead>
                                            <TableHead className="font-semibold text-foreground h-14">{t("common.pages")}</TableHead>
                                            <TableHead className="font-semibold text-foreground h-14">{t("salary.charsNoWith")}</TableHead>
                                            {/* Додаємо колонку тільки для перекладача */}
                                            {isTranslator && (
                                                <TableHead className="font-semibold text-foreground h-14 text-center">{t("salary.averageScore")}</TableHead>
                                            )}
                                        </>
                                    )}

                                    {/* Спільні фінансові колонки */}
                                    <TableHead className="font-semibold text-foreground h-14 w-[110px]">{t("salary.baseSalary")}</TableHead>
                                    <TableHead className="font-semibold text-foreground h-14 w-[110px]">{t("salary.bonus")}</TableHead>
                                    <TableHead className="font-semibold text-foreground h-14 w-[110px]">{t("salary.premium")}</TableHead>
                                    <TableHead className="font-semibold text-emerald-600 h-14 text-right">{t("salary.total")}</TableHead>
                                    <TableHead className="font-semibold text-foreground h-14 pr-6 text-right">{t("common.actions")}</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {usersLoading || previewsLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={colSpanCount} className="h-24 text-center text-muted-foreground">
                                            {t("salary.loadingStats")}
                                        </TableCell>
                                    </TableRow>
                                ) : users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={colSpanCount} className="h-24 text-center text-muted-foreground">
                                            {t("salary.noEmployees")}
                                        </TableCell>
                                    </TableRow>
                                ) : users.map((user: User) => {
                                    // 🔥 Додаємо is_saved зі значенням за замовчуванням false
                                    const stats = previews[user.id] || { revenue: 0, orders_count: 0, overdue_orders_count: 0, margin: 0, pages_count: 0, chars_count: 0, chars_with_spaces_count: 0, average_score: 0, is_saved: false }
                                    const draft = drafts[user.id] ?? previewDrafts[user.id] ?? { base_salary: 0, bonus: 0, premium: 0 }

                                    const totalCalculated = draft.base_salary + draft.bonus + draft.premium;

                                    // 🔥 Зчитуємо статус з бекенду (або з оновленого стейту після збереження)
                                    const hasSavedSalary = stats.is_saved;

                                    return (
                                        <Fragment key={user.id}>
                                            <TableRow className={cn("transition-colors hover:bg-muted/30", expandedId === user.id && "bg-primary/5")}>
                                                <TableCell className="align-middle h-16 pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center text-sm font-semibold text-blue-600 border border-blue-200">
                                                            {user.full_name?.[0] || "U"}
                                                        </div>
                                                        <div className="leading-tight">
                                                            <p className="text-sm font-medium text-foreground">{user.full_name}</p>
                                                            <p className="text-xs text-muted-foreground">{getRoleLabel()}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {isManager ? (
                                                    <>
                                                        <TableCell className="align-middle">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className="bg-background">{stats.orders_count}</Badge>
                                                                <span className="text-muted-foreground text-xs">/</span>
                                                                <Badge variant="outline" className={cn("bg-red-50 text-red-600 border-red-200", stats.overdue_orders_count === 0 && "bg-background text-muted-foreground border-border")}>
                                                                    <AlertCircle className="w-3 h-3 mr-1" />{stats.overdue_orders_count}
                                                                </Badge>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="align-middle">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-semibold text-foreground">{formatCurrency(Number(stats.revenue))}</span>
                                                                <span className="text-xs text-emerald-600 font-medium">{t("orders.margin")} {stats.margin || 0}%</span>
                                                            </div>
                                                        </TableCell>
                                                    </>
                                                ) : (
                                                    <>
                                                        <TableCell className="align-middle">
                                                            <Badge variant="outline" className="bg-background">{stats.orders_count}</Badge>
                                                        </TableCell>
                                                        <TableCell className="align-middle">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-semibold text-foreground">{formatCurrency(Number(stats.revenue))}</span>
                                                                {/* Маржу показуємо тільки редакторам */}
                                                                {isEditor && (
                                                                    <span className="text-xs text-emerald-600 font-medium">{t("orders.margin")} {stats.margin || 0}%</span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="align-middle text-sm font-medium">
                                                            {stats.pages_count || 0}
                                                        </TableCell>
                                                        <TableCell className="align-middle text-sm text-muted-foreground whitespace-nowrap">
                                                            <span className="text-foreground font-medium">{stats.chars_count || 0}</span> / {stats.chars_with_spaces_count || 0}
                                                        </TableCell>
                                                        {/* Оцінка для перекладача */}
                                                        {isTranslator && (
                                                            <TableCell className="align-middle text-center">
                                                                <Badge variant="secondary" className="gap-1.5 font-medium px-2.5 py-0.5">
                                                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                                    {(stats.average_score ?? 0) > 0 ? stats.average_score!.toFixed(1) : "—"}
                                                                </Badge>
                                                            </TableCell>
                                                        )}
                                                    </>
                                                )}

                                                {/* Спільні фінансові інпути */}
                                                <TableCell className="align-middle">
                                                    <input type="number" value={draft.base_salary || ""} onChange={(e) => handleDraftChange(user.id, "base_salary", e.target.value)} className="w-[90px] h-9 px-2 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all" placeholder="0"/>
                                                </TableCell>
                                                <TableCell className="align-middle">
                                                    <input type="number" value={draft.bonus || ""} onChange={(e) => handleDraftChange(user.id, "bonus", e.target.value)} className="w-[90px] h-9 px-2 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all" placeholder="0"/>
                                                </TableCell>
                                                <TableCell className="align-middle">
                                                    <input type="number" value={draft.premium || ""} onChange={(e) => handleDraftChange(user.id, "premium", e.target.value)} className="w-[90px] h-9 px-2 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all" placeholder="0"/>
                                                </TableCell>
                                                <TableCell className="align-middle text-right font-bold text-emerald-600 text-base">
                                                    {formatCurrency(totalCalculated)}
                                                </TableCell>

                                                <TableCell className="align-middle pr-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {/* 🔥 Динамічна кнопка */}
                                                        <Button
                                                            size="sm"
                                                            variant={hasSavedSalary ? "secondary" : "default"}
                                                            onClick={() => handleSaveUserSalary(user.id)}
                                                            className="h-8 gap-1.5 shadow-sm"
                                                        >
                                                            <Save className="w-3.5 h-3.5" />
                                                            {hasSavedSalary ? t("salary.change") : t("common.save")}
                                                        </Button>
                                                        <Button size="sm" variant="outline" onClick={() => handleToggleHistory(user.id)} className={cn("h-8 w-8 p-0 rounded-full transition-transform", expandedId === user.id && "bg-muted")}>
                                                            <History className="w-4 h-4 text-muted-foreground" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>

                                            {/* РОЗГОРНУТИЙ РЯДОК ІСТОРІЇ */}
                                            {expandedId === user.id && (
                                                <TableRow className="bg-muted/10 border-b-0">
                                                    <TableCell colSpan={colSpanCount} className="p-0 border-b-0 relative">
                                                        {/* Компонент історії */}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </Fragment>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </>
    )
}
