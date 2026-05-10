"use client"

import { useEffect, useMemo, useState } from "react"
import { Users, ChevronDown, CheckCircle, Search } from "lucide-react"
import { cn } from "@/src/lib/utils"

import { ordersApi } from "@/src/features/orders/api"
import type { OrderMarginsResponse } from "@/src/features/orders/types"

export interface Translator {
    id: number
    name?: string
    full_name?: string
    trafficId?: number
    rating?: number
    specializations?: string[]
    completed?: number
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
                                     placeholder = "Choose a translator"
                                 }: TranslatorSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    const [loadingMargins, setLoadingMargins] = useState(false)
    const [marginByTranslator, setMarginByTranslator] = useState<Record<number, MarginInfo>>({})
    const [ttByTranslator, setTtByTranslator] = useState<Record<number, number>>({})
    const [matchByTranslator, setMatchByTranslator] = useState<Record<number, MatchInfo>>({})
    const [orderedTranslatorIds, setOrderedTranslatorIds] = useState<number[]>([])

    const selectedTranslator = useMemo(
        () => translators.find((t) => t.id === value),
        [translators, value]
    )

    const getDisplayName = (t?: Translator) => {
        if (!t) return ""
        return t.full_name || t.name || `Translator`
    }

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

    const filteredAndSortedTranslators = useMemo(() => {
        let sorted = [...translators]
        if (orderedTranslatorIds.length) {
            const pos = new Map<number, number>()
            orderedTranslatorIds.forEach((id, i) => pos.set(id, i))
            sorted.sort((a, b) => {
                const pa = pos.get(a.id)
                const pb = pos.get(b.id)
                if (pa == null && pb == null) return 0
                if (pa == null) return 1
                if (pb == null) return -1
                return pa - pb
            })
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            sorted = sorted.filter(t => {
                const name = getDisplayName(t).toLowerCase()
                return name.includes(query) || String(t.id).includes(query)
            })
        }

        return sorted
    }, [translators, orderedTranslatorIds, searchQuery])

    useEffect(() => {
        if (!isOpen) setSearchQuery("")
    }, [isOpen])

    return (
        <div className="space-y-1.5 relative">
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
                        <div className="flex items-center gap-1.5 min-w-0 truncate text-gray-900 dark:text-gray-100">
                            <span className="whitespace-nowrap">ID: {selectedTranslator.id}</span>
                            <span className="truncate">{getDisplayName(selectedTranslator)}</span>
                            {orderTrafficId && !loadingMargins && marginByTranslator[selectedTranslator.id] && (
                                <span className="whitespace-nowrap">
                                    • Margin: {Number(marginByTranslator[selectedTranslator.id].percent).toFixed(1)}%
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="text-gray-500 dark:text-gray-400 text-sm">{placeholder}</span>
                    )}

                    <ChevronDown
                        className={cn(
                            "h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2",
                            isOpen && "rotate-180"
                        )}
                    />
                </button>

                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col">

                            <div className="p-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                    <input
                                        type="text"
                                        autoFocus
                                        placeholder="Search by name or ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="max-h-72 overflow-y-auto p-1">
                                {filteredAndSortedTranslators.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-gray-500">
                                        No translators found
                                    </div>
                                ) : (
                                    filteredAndSortedTranslators.map((translator) => {
                                        const mi = marginByTranslator[translator.id]
                                        const match = matchByTranslator[translator.id]
                                        const displayName = getDisplayName(translator)

                                        return (
                                            <button
                                                key={translator.id}
                                                onClick={() => {
                                                    const translatorTrafficId = ttByTranslator[translator.id] ?? translator.trafficId ?? null
                                                    onChange(translator.id, translatorTrafficId)
                                                    setIsOpen(false)
                                                }}
                                                className={cn(
                                                    "w-full px-3 py-2 flex items-center justify-between gap-2 rounded-md",
                                                    "hover:bg-gray-50 dark:hover:bg-gray-800/50",
                                                    "transition-colors duration-150",
                                                    "text-left text-sm",
                                                    value === translator.id && "bg-blue-50 dark:bg-blue-900/20"
                                                )}
                                            >
                                                <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate text-gray-900 dark:text-gray-100">
                                                    <span className="whitespace-nowrap">ID: {translator.id}</span>
                                                    <span className="truncate">{displayName}</span>

                                                    {mi && (
                                                        <span className="whitespace-nowrap">• {Number(mi.percent).toFixed(1)}%</span>
                                                    )}

                                                    {match && (
                                                        <span className="whitespace-nowrap">| {match.lp} {match.cat}</span>
                                                    )}

                                                    {translator.rating && (
                                                        <span className="whitespace-nowrap">| ⭐ {translator.rating}</span>
                                                    )}

                                                    {translator.specializations && translator.specializations.length > 0 && (
                                                        <span className="truncate">| {translator.specializations.slice(0, 2).join(", ")}</span>
                                                    )}
                                                </div>

                                                {value === translator.id && (
                                                    <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 ml-2" />
                                                )}
                                            </button>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {orderTrafficId && (
                <p className="text-[10px] text-gray-500 mt-1 px-1">
                    Showing translators optimized for traffic ID: {orderTrafficId}
                </p>
            )}
        </div>
    )
}