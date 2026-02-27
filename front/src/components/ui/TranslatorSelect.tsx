"use client"

import { useEffect, useMemo, useState } from "react"
import { Users, ChevronDown, CheckCircle } from "lucide-react"
import { cn } from "@/src/lib/utils"

import { ordersApi } from "@/src/features/orders/api"
import type { OrderMarginsResponse } from "@/src/features/orders/types"

export interface Translator {
    id: number
    name: string
    trafficId: number
    rating?: number
    specializations?: string[]
    completed?: number
    avatar?: string
    full_name?: string
}

interface TranslatorSelectProps {
    value: number | null
    onChange: (translatorId: number | null, translatorTrafficId: number | null) => void
    orderTrafficId: number | null
    translators: Translator[]

    placeholder?: string
    sourceLanguage?: string
    targetLanguage?: string
}

type MarginInfo = { percent: string; label: string }
type MatchInfo = { lp: string; cat: string }

export function TranslatorSelect({
    value,
    onChange,
    orderTrafficId,
    translators,
}: TranslatorSelectProps) {
    const [isOpen, setIsOpen] = useState(false)

    const [loadingMargins, setLoadingMargins] = useState(false)
    const [marginByTranslator, setMarginByTranslator] = useState<Record<number, MarginInfo>>({})
    const [ttByTranslator, setTtByTranslator] = useState<Record<number, number>>({})
    const [matchByTranslator, setMatchByTranslator] = useState<Record<number, MatchInfo>>({})
    const [orderedTranslatorIds, setOrderedTranslatorIds] = useState<number[]>([])

    const selectedTranslator = useMemo(
        () => translators.find((t) => t.id === value),
        [translators, value]
    )

    useEffect(() => {
        let cancelled = false

        async function loadMargins() {
            if (!orderTrafficId) {
                setMarginByTranslator({})
                setTtByTranslator({})
                setMatchByTranslator({})
                setOrderedTranslatorIds([])
                return
            }

            setLoadingMargins(true)
            try {
                const res: OrderMarginsResponse = await ordersApi.getOrderMargins(orderTrafficId)

                const m: Record<number, MarginInfo> = {}
                const tt: Record<number, number> = {}
                const match: Record<number, MatchInfo> = {}
                const order: number[] = []

                for (const row of res.results ?? []) {
                    order.push(row.translator_id)

                    if (row.margin_percent != null && row.margin_label != null) {
                        m[row.translator_id] = { percent: row.margin_percent, label: row.margin_label }
                    }

                    if (row.translator_traffic_id != null) {
                        tt[row.translator_id] = row.translator_traffic_id
                    }

                    match[row.translator_id] = {
                        lp: row.language_pair_label,
                        cat: row.category_label,
                    }
                }

                if (!cancelled) {
                    setMarginByTranslator(m)
                    setTtByTranslator(tt)
                    setMatchByTranslator(match)
                    setOrderedTranslatorIds(order)
                }
            } catch (e) {
                if (!cancelled) {
                    setMarginByTranslator({})
                    setTtByTranslator({})
                    setMatchByTranslator({})
                    setOrderedTranslatorIds([])
                }
            } finally {
                if (!cancelled) setLoadingMargins(false)
            }
        }

        loadMargins()
        return () => {
            cancelled = true
        }
    }, [orderTrafficId])

    const sortedTranslators = useMemo(() => {
        if (!orderedTranslatorIds.length) return translators
        const pos = new Map<number, number>()
        orderedTranslatorIds.forEach((id, i) => pos.set(id, i))
        return [...translators].sort((a, b) => {
            const pa = pos.get(a.id)
            const pb = pos.get(b.id)
            if (pa == null && pb == null) return 0
            if (pa == null) return 1
            if (pb == null) return -1
            return pa - pb
        })
    }, [translators, orderedTranslatorIds])

    return (
        <div className="space-y-1.5 relative">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                <Users className="h-3.5 w-3.5 text-blue-600" />
                <span>Select Translator</span>
            </label>

            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "w-full px-3 py-2 bg-white dark:bg-gray-900 border rounded-lg",
                        "flex items-center justify-between",
                        "transition-all duration-200",
                        "text-sm",
                        isOpen
                            ? "border-blue-600 ring-2 ring-blue-600/20"
                            : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                    )}
                >
                    {selectedTranslator ? (
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-medium text-xs flex-shrink-0">
                                {selectedTranslator.avatar || selectedTranslator.name?.charAt(0) || "?"}
                            </div>

                            <div className="text-left min-w-0">
                                <div className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                                    {(selectedTranslator.full_name || selectedTranslator.name || "").trim() || `ID: ${selectedTranslator.id}`}
                                </div>

                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <span>ID: {selectedTranslator.id}</span>

                                    {orderTrafficId && (
                                        <>
                                            <span>•</span>
                                            {loadingMargins ? (
                                                <span>Margin…</span>
                                            ) : marginByTranslator[selectedTranslator.id] ? (
                                                <span className="tabular-nums">
                                                    {Number(marginByTranslator[selectedTranslator.id].percent).toFixed(2)}%{" "}
                                                    {marginByTranslator[selectedTranslator.id].label}
                                                </span>
                                            ) : (
                                                <span>Margin: —</span>
                                            )}

                                            {matchByTranslator[selectedTranslator.id] && (
                                                <>
                                                    <span>•</span>
                                                    <span>
                                                        Мови: {matchByTranslator[selectedTranslator.id].lp} · Категорія: {matchByTranslator[selectedTranslator.id].cat}
                                                    </span>
                                                </>
                                            )}
                                        </>
                                    )}

                                    {selectedTranslator.rating && (
                                        <>
                                            <span>•</span>
                                            <span>⭐ {selectedTranslator.rating}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <span className="text-gray-500 dark:text-gray-400 text-sm">Choose a translator</span>
                    )}

                    <ChevronDown
                        className={cn(
                            "h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0",
                            isOpen && "rotate-180"
                        )}
                    />
                </button>

                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg py-1 max-h-72 overflow-y-auto">
                            {sortedTranslators.map((translator) => {
                                const mi = marginByTranslator[translator.id]
                                const match = matchByTranslator[translator.id]

                                const rightLabel =
                                    !orderTrafficId
                                        ? "—"
                                        : loadingMargins
                                            ? "…"
                                            : mi
                                                ? `${Number(mi.percent).toFixed(2)}% ${mi.label}`
                                                : "—"

                                return (
                                    <button
                                        key={translator.id}
                                        onClick={() => {
                                            const translatorTrafficId =
                                                ttByTranslator[translator.id] ?? translator.trafficId ?? null

                                            onChange(translator.id, translatorTrafficId)
                                            setIsOpen(false)
                                        }}
                                        className={cn(
                                            "w-full px-3 py-2 flex items-center gap-2",
                                            "hover:bg-gray-50 dark:hover:bg-gray-800",
                                            "transition-colors duration-150",
                                            "text-left",
                                            value === translator.id && "bg-blue-50 dark:bg-blue-950/30"
                                        )}
                                    >
                                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-medium text-xs flex-shrink-0">
                                            {translator.avatar || translator.name?.charAt(0) || "?"}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                                                    {translator.name}
                                                </div>

                                                <div className="text-xs text-gray-500 tabular-nums whitespace-nowrap">
                                                    {rightLabel}{match ? ` · LP:${match.lp} CAT:${match.cat}` : ""}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <span>ID: {translator.trafficId}</span>

                                                {translator.rating && (
                                                    <>
                                                        <span>•</span>
                                                        <span>⭐ {translator.rating}</span>
                                                    </>
                                                )}
                                                {translator.completed && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{translator.completed} jobs</span>
                                                    </>
                                                )}
                                            </div>

                                            {translator.specializations && translator.specializations.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-0.5">
                                                    {translator.specializations.slice(0, 2).map((spec: string, i: number) => (
                                                        <span
                                                            key={i}
                                                            className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400"
                                                        >
                                                            {spec}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {value === translator.id && (
                                            <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>

            {orderTrafficId && (
                <p className="text-[10px] text-gray-500 mt-1">
                    Available translators for traffic ID: {orderTrafficId}
                </p>
            )}
        </div>
    )
}