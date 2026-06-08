"use client"

import { useRouter } from "next/navigation"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/src/components/ui/table"
import { TrendingUp, TrendingDown } from "lucide-react"

import type { EditorStatItem } from "../types"

function formatCurrency(val: number | string) {
    return `${Number(val || 0).toLocaleString("uk-UA", { maximumFractionDigits: 0 })} грн`
}

function formatPercent(val: number | string) {
    return `${Number(val || 0).toFixed(1)}%`
}

interface EditorStatsTableProps {
    data: EditorStatItem[]
    loading: boolean
}

export function EditorStatsTable({ data, loading }: EditorStatsTableProps) {
    const router = useRouter()

    const handleRowClick = (editorId: number) => {
        // Заділ на майбутнє для детальної сторінки редактора
        router.push(`/dashboard/editor-stats/${editorId}`)
    }

    return (
        <div className="flex flex-col h-full">
            <div className="overflow-auto">
                <Table>
                    <TableHeader className="bg-white">
                        <TableRow className="hover:bg-transparent border-b border-slate-100">
                            <TableHead className="h-12 pl-6 font-semibold text-slate-700 w-[260px]">
                                Працівник
                            </TableHead>
                            <TableHead className="h-12 font-semibold text-slate-700 text-center">
                                Замовлення
                            </TableHead>
                            <TableHead className="h-12 font-semibold text-slate-700">
                                Виручка / Маржа
                            </TableHead>
                            <TableHead className="h-12 font-semibold text-slate-700 text-center">
                                Сторінки
                            </TableHead>
                            <TableHead className="h-12 font-semibold text-slate-700 text-center pr-6">
                                Символи (без / з)
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
                            data.map((editor) => {
                                const margin = Number(editor.avg_margin_percent || 0)

                                return (
                                    <TableRow
                                        key={editor.id}
                                        onClick={() => handleRowClick(editor.id)}
                                        className="cursor-pointer transition-colors hover:bg-slate-50 border-b border-slate-50 last:border-0"
                                    >
                                        {/* 1. Працівник */}
                                        <TableCell className="py-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                                                    {editor.full_name?.[0]?.toUpperCase() || "E"}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm">
                                                        {editor.full_name}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                        Редактор
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* 2. Замовлення */}
                                        <TableCell className="py-4 text-center">
                                            <span className="font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full text-xs">
                                                {editor.total_orders}
                                            </span>
                                        </TableCell>

                                        {/* 3. Виручка / Маржа */}
                                        <TableCell className="py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5">
                                                    {Number(editor.total_revenue) > 0 && (
                                                        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                                                    )}
                                                    <span className="font-semibold text-slate-900 text-sm">
                                                        {formatCurrency(editor.total_revenue)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={margin >= 50 ? "text-[11px] font-medium text-emerald-600" : "text-[11px] font-medium text-amber-600"}>
                                                        Маржа: {formatPercent(margin)}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* 4. Сторінки */}
                                        <TableCell className="py-4 text-center">
                                            <span className="font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg text-sm border border-blue-100">
                                                {Number(editor.total_pages || 0)}
                                            </span>
                                        </TableCell>

                                        {/* 5. Символи (без / з) */}
                                        <TableCell className="py-4 text-center pr-6">
                                            <div className="text-sm font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 inline-block">
                                                {editor.total_chars_without || 0} <span className="text-slate-300 mx-1">/</span> {editor.total_chars_with || 0}
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