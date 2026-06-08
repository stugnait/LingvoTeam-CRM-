"use client"

import { useRouter } from "next/navigation"
import { cn } from "@/src/lib/utils"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/src/components/ui/table"
import {
    AlertCircle,
    TrendingUp,
    TrendingDown,
    ChevronLeft,
    ChevronRight,
} from "lucide-react"
import { Button } from "@/src/components/ui/button"

import type { ManagerStatItem } from "../types"

function formatCurrency(val: number | string) {
    return `${Number(val).toLocaleString("uk-UA", { maximumFractionDigits: 0 })} грн`
}

function formatPercent(val: number | string) {
    return `${Number(val).toFixed(1)}%`
}

interface ManagerStatsTableProps {
    data:    ManagerStatItem[]
    loading: boolean
}

export function ManagerStatsTable({ data, loading }: ManagerStatsTableProps) {
    const router = useRouter()

    const handleRowClick = (managerId: number) => {
        router.push(`/dashboard/manager-stats/${managerId}`)
    }

    return (
        <div className="flex flex-col h-full">
            <div className="overflow-auto">
                <Table>
                    <TableHeader className="bg-white">
                        <TableRow className="hover:bg-transparent border-b border-slate-100">
                            <TableHead className="h-12 pl-6 font-semibold text-slate-700 w-[260px]">
                                Менеджер
                            </TableHead>
                            <TableHead className="h-12 font-semibold text-slate-700">
                                Замовлення
                            </TableHead>
                            <TableHead className="h-12 font-semibold text-slate-700">
                                Клієнти
                            </TableHead>
                            <TableHead className="h-12 font-semibold text-slate-700">
                                Виручка
                            </TableHead>
                            <TableHead className="h-12 font-semibold text-slate-700">
                                Середній чек
                            </TableHead>
                            <TableHead className="h-12 font-semibold text-slate-700">
                                Маржа
                            </TableHead>
                            <TableHead className="h-12 font-semibold text-slate-700 text-center w-[150px]">
                                Прострочені
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-slate-400">
                                    Завантаження даних...
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-slate-400">
                                    Дані відсутні за вибраний період
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((manager) => {
                                const margin = Number(manager.avg_margin_percent)

                                return (
                                    <TableRow
                                        key={manager.id}
                                        onClick={() => handleRowClick(manager.id)}
                                        className="cursor-pointer transition-colors hover:bg-slate-50 border-b border-slate-50 last:border-0"
                                    >
                                        {/* 1. Менеджер */}
                                        <TableCell className="py-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center font-bold text-sm shrink-0">
                                                    {manager.full_name?.[0]?.toUpperCase() || "M"}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm">
                                                        {manager.full_name}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                        Менеджер
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* 2. Замовлення */}
                                        <TableCell className="py-4">
                                            <span className="font-medium text-slate-700">
                                                {manager.total_orders}
                                            </span>
                                        </TableCell>

                                        {/* 3. Клієнти */}
                                        <TableCell className="py-4">
                                            <span className="font-medium text-slate-700">
                                                {manager.total_clients}
                                            </span>
                                        </TableCell>

                                        {/* 4. Виручка */}
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-2">
                                                {Number(manager.total_revenue) > 0 && (
                                                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                                                )}
                                                <span className="font-semibold text-slate-900 text-sm">
                                                    {formatCurrency(manager.total_revenue)}
                                                </span>
                                            </div>
                                        </TableCell>

                                        {/* 5. Середній чек */}
                                        <TableCell className="py-4">
                                            <span className="text-sm text-slate-600 font-medium">
                                                {formatCurrency(manager.avg_order_value)}
                                            </span>
                                        </TableCell>

                                        {/* 6. Маржа */}
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-1.5">
                                                {margin >= 50 ? (
                                                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                                                ) : (
                                                    <TrendingDown className="h-3.5 w-3.5 text-amber-500" />
                                                )}
                                                <span className={margin >= 50 ? "text-sm font-semibold text-emerald-600" : "text-sm font-semibold text-amber-600"}>
                                                    {formatPercent(margin)}
                                                </span>
                                            </div>
                                        </TableCell>

                                        {/* 7. Прострочені */}
                                        <TableCell className="py-4 text-center">
                                            {manager.overdue_orders_count > 0 ? (
                                                <div className="inline-flex items-center justify-center gap-1.5 bg-red-50 text-red-600 border border-red-100 rounded-full px-3 py-1 text-xs font-semibold">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    {manager.overdue_orders_count}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 font-medium text-sm">0</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}