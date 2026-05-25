"use client"

import * as React from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select"

import { ordersApi } from "@/src/features/orders/api"
import type { Translator } from "@/src/features/translators/types"
import type { OrderMarginsResponse } from "@/src/features/orders/types"

interface TranslatorSelectProps {
    translators: Translator[]
    value: number | null

    // ✅ тепер віддаємо ще translatorTrafficId
    onChange: (translatorId: number | null, translatorTrafficId: number | null) => void

    disabled?: boolean
    orderTrafficId?: number | null // це traffic_id з форми
}

export function TranslatorSelect({
                                     translators,
                                     value,
                                     onChange,
                                     disabled,
                                     orderTrafficId,
                                 }: TranslatorSelectProps) {
    const [loading, setLoading] = React.useState(false)

    // translator_id -> "40.00"
    type MarginInfo = {
        percent: string | null
        label: string | null
    }

    // translator_id -> { percent, label }
    const [marginByTranslator, setMarginByTranslator] = React.useState<Record<number, MarginInfo>>({})    // translator_id -> translator_traffic_id
    const [ttByTranslator, setTtByTranslator] = React.useState<Record<number, number | null>>({})

    React.useEffect(() => {
        let cancelled = false

        async function load() {
            if (!orderTrafficId) {
                setMarginByTranslator({})
                setTtByTranslator({})
                return
            }

            setLoading(true)
            try {
                const res: OrderMarginsResponse = await ordersApi.getOrderMargins(orderTrafficId)

                const m: Record<number, MarginInfo> = {}
                const tt: Record<number, number | null> = {}

                for (const row of res.results ?? []) {
                    m[row.translator_id] = {
                        percent: row.margin_percent,
                        label: row.margin_label
                    }
                    tt[row.translator_id] = row.translator_traffic_id
                }

                if (!cancelled) {
                    setMarginByTranslator(m)
                    setTtByTranslator(tt)
                }
            } catch {
                if (!cancelled) {
                    setMarginByTranslator({})
                    setTtByTranslator({})
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [orderTrafficId])

    return (
        <Select
            value={value !== null ? value.toString() : undefined}
            onValueChange={(v) => {
                const translatorId = Number(v)
                const translatorTrafficId = ttByTranslator[translatorId] ?? null
                onChange(translatorId, translatorTrafficId)
            }}
            disabled={disabled}
        >
            <SelectTrigger>
                <SelectValue placeholder="Select translator" />
            </SelectTrigger>

            <SelectContent>
                {translators.map((translator) => {
                    const marginInfo = marginByTranslator[translator.id]

                    let label = "—"
                    if (!orderTrafficId) {label = "—"}
                    else if (loading) {label = "…"}
                    else if (marginInfo) {label = `${Number(marginInfo.percent).toFixed(0)}% ${marginInfo.label}`}

                    return (
                        <SelectItem key={translator.id} value={translator.id.toString()}>
                            <div className="flex w-full items-center justify-between gap-3">
                                <span className="truncate">{translator.full_name}</span>
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    {label}
                                </span>
                            </div>
                        </SelectItem>
                    )
                })}
            </SelectContent>
        </Select>
    )
}
