"use client"

import { useRouter } from "next/navigation"
import {
    Table, TableBody, TableCell,
    TableHead, TableHeader, TableRow,
} from "@/src/components/ui/table"
import { TrendingUp, TrendingDown, Star } from "lucide-react"
import type { TranslatorStatItem } from "../types"

function formatCurrency(val: number | string) {
    return `${Number(val).toLocaleString("uk-UA", { maximumFractionDigits: 0 })} грн`
}

function formatPercent(val: number | string) {
    return `${Number(val).toFixed(1)}%`
}

interface TranslatorStatsTableProps {
    data:    TranslatorStatItem[]
    loading: boolean
}

export function TranslatorStatsTable({ data, loading }: TranslatorStatsTableProps) {
    const router = useRouter()

    return (
        <div className="flex flex-col h-full">
            <div className="overflow-auto">
                <Table>
                    <TableHeader className="bg-white">
                        <TableRow className="hover:bg-transparent border-b border-slate-100">
                            <TableHead className="h-12 pl-6 font-semibold text-slate-700 w-[260px]">
                                Перекладач
                            </TableHead>
                            <TableHead className="h-12 font-semibold text-slate-700">
                                Замовлень
                            </TableHead>
                            <TableHead className="h-12 font-semibold text-slate-700">
                                Середня маржа
                            </TableHead>
                            <TableHead className="h-12 font-semibold text-slate-700">
                                Виплати перекладачу
                            </TableHead>
                            <TableHead className="h-12 font-semibold text-slate-700 text-center w-[140px]">
                                Рейтинг
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-slate-400">
                                    Завантаження даних...
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-slate-400">
                                    Дані відсутні за вибраний період
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((translator) => {
                                const margin = Number(translator.avg_margin_percent ?? 0)
                                const marginGood = margin >= 50

                                return (
                                    <TableRow
                                        key={translator.id}
                                        onClick={() => router.push(`/dashboard/translators-stats/${translator.id}`)}
                                        className="cursor-pointer transition-colors hover:bg-slate-50 border-b border-slate-50 last:border-0"
                                    >
                                        {/* 1. Перекладач */}
                                        <TableCell className="py-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">
                                                    {translator.full_name?.[0]?.toUpperCase() || "T"}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm">
                                                        {translator.full_name}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-0.5">Перекладач</p>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* 2. Замовлень */}
                                        <TableCell className="py-4">
                                            <span className="font-medium text-slate-700">
                                                {translator.total_orders}
                                            </span>
                                        </TableCell>

                                        {/* 3. Середня маржа */}
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-1.5">
                                                {marginGood
                                                    ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                                                    : <TrendingDown className="h-3.5 w-3.5 text-amber-500" />
                                                }
                                                <span className={`text-sm font-semibold ${marginGood ? "text-emerald-600" : "text-amber-600"}`}>
                                                    {formatPercent(margin)}
                                                </span>
                                            </div>
                                        </TableCell>

                                        {/* 4. Виплати */}
                                        <TableCell className="py-4">
                                            <span className="text-sm text-slate-600 font-medium">
                                                {translator.total_payout
                                                    ? formatCurrency(translator.total_payout)
                                                    : <span className="text-slate-400 italic text-xs">—</span>
                                                }
                                            </span>
                                        </TableCell>

                                        {/* 5. Рейтинг */}
                                        <TableCell className="py-4 text-center">
                                            <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full px-2.5 py-1 text-xs font-semibold">
                                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                {Number(translator.avg_rating ?? 0).toFixed(1)}
                                            </div>
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