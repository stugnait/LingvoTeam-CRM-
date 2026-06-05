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
    ChevronLeft,
    ChevronRight,
} from "lucide-react"
import { Button } from "@/src/components/ui/button"

import type { ClientStatItem } from "../types"

function formatCurrency(val: number | string) {
    return `${Number(val).toLocaleString("uk-UA", { maximumFractionDigits: 0 })} грн`
}

interface ClientStatsTableProps {
    data: ClientStatItem[]
    loading: boolean
}

export function ClientStatsTable({
                                     data,
                                     loading,
                                 }: ClientStatsTableProps) {
    const router = useRouter()

    const handleRowClick = (clientId: number) => {
        router.push(`/dashboard/client-stats/${clientId}`)
    }

    return (
        <div className="flex flex-col h-full">
            <div className="overflow-auto">
                <Table>
                    <TableHeader className="bg-white">
                        <TableRow className="hover:bg-transparent border-b border-slate-100">
                            <TableHead className="h-12 pl-6 font-semibold text-slate-700 w-[300px]">
                                Клієнт
                            </TableHead>
                            <TableHead className="h-12 font-semibold text-slate-700">
                                Замовлення
                            </TableHead>
                            <TableHead className="h-12 font-semibold text-slate-700">
                                Загальна сума
                            </TableHead>
                            <TableHead className="h-12 font-semibold text-slate-700">
                                Середній чек
                            </TableHead>
                            <TableHead className="h-12 font-semibold text-slate-700 text-center w-[150px]">
                                Неоплачені
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="h-32 text-center text-slate-400"
                                >
                                    Завантаження даних...
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="h-32 text-center text-slate-400"
                                >
                                    Дані відсутні за вибраний період
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((client) => (
                                <TableRow
                                    key={client.id}
                                    onClick={() => handleRowClick(client.id)}
                                    className="cursor-pointer transition-colors hover:bg-slate-50 border-b border-slate-50 last:border-0"
                                >
                                    {/* 1. Клієнт */}
                                    <TableCell className="py-4 pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                                                {client.full_name?.[0]?.toUpperCase() || "C"}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900 text-sm">
                                                    {client.full_name}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    Клієнт
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>

                                    {/* 2. Замовлення */}
                                    <TableCell className="py-4">
                                        <span className="font-medium text-slate-700">
                                            {client.total_orders}
                                        </span>
                                    </TableCell>

                                    {/* 3. Загальна сума */}
                                    <TableCell className="py-4">
                                        <div className="flex items-center gap-2">
                                            {Number(client.total_revenue) > 0 && (
                                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                                            )}
                                            <span className="font-semibold text-slate-900 text-sm">
                                                {formatCurrency(client.total_revenue)}
                                            </span>
                                        </div>
                                    </TableCell>

                                    {/* 4. Середній чек */}
                                    <TableCell className="py-4">
                                        <span className="text-sm text-slate-600 font-medium">
                                            {formatCurrency(client.avg_order_value)}
                                        </span>
                                    </TableCell>

                                    {/* 5. Неоплачені */}
                                    <TableCell className="py-4 text-center">
                                        {client.unpaid_orders_count > 0 ? (
                                            <div className="inline-flex items-center justify-center gap-1.5 bg-red-50 text-red-600 border border-red-100 rounded-full px-3 py-1 text-xs font-semibold">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                {client.unpaid_orders_count}
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 font-medium text-sm">0</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}