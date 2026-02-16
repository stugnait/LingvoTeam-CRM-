"use client"

import {useEffect, useState} from "react"
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
import { ChevronDown, ChevronUp } from "lucide-react"

import type {
    OrderListItem,
    CreateOrderResponse,
    LanguagePair,
    Translator,
    AnalyzeImagesResponse
} from "@/src/features/orders/types"
import { ordersApi } from "@/src/features/orders/api"
import {cn} from "@/src/lib/utils";

interface OrdersTableProps {
    orders: OrderListItem[]
    onOpen: (orderId: number) => Promise<CreateOrderResponse>
    languagePairs: Record<number, LanguagePair>
    translatorsCache: Record<number, Translator>
    highlightId?: number
}

export function OrdersTable({ orders, onOpen, languagePairs, translatorsCache, highlightId }: OrdersTableProps) {
    const [expandedId, setExpandedId] = useState<number | null>(null)
    const [details, setDetails] = useState<CreateOrderResponse | null>(null)
    const [loadingId, setLoadingId] = useState<number | null>(null)
    const [analyzeLoadingId, setAnalyzeLoadingId] = useState<number | null>(null)
    const [analyzeResult, setAnalyzeResult] = useState<AnalyzeImagesResponse | null>(null)
    const [activeHighlightId, setActiveHighlightId] = useState<number | null>(null)


    const handleAnalyzeImages = async (orderId: number) => {
        try {
            setAnalyzeLoadingId(orderId)
            const res = await ordersApi.analyzeImages(orderId)
            setAnalyzeResult(res)
        } finally {
            setAnalyzeLoadingId(null)
        }
    }


    const handleToggle = async (orderId: number) => {
        if (expandedId === orderId) {
            setExpandedId(null)
            setDetails(null)
            return
        }

        setExpandedId(orderId)
        setLoadingId(orderId)

        const res = await onOpen(orderId)
        setDetails(res)
        setLoadingId(null)
    }

    useEffect(() => {
        if (!highlightId) {return}

        setActiveHighlightId(highlightId)

        const timer = setTimeout(() => {
            setActiveHighlightId(null)
        }, 5000)

        return () => clearTimeout(timer)
    }, [highlightId])



    const getStatusVariant = (status: string) =>
        status === "completed" ? "default" : "warning"

    const getTranslatorName = (translatorId: number | null) => {
        if (!translatorId) {return "—"}
        const translator = translatorsCache[translatorId]
        return translator?.full_name || `Translator #${translatorId}`
    }

    return (
        <div className="border border-border rounded-lg bg-card mx-4 my-6 shadow-soft">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold text-foreground h-14 pl-6">ID</TableHead>
                        <TableHead className="font-semibold text-foreground h-14">Client</TableHead>
                        <TableHead className="font-semibold text-foreground h-14">Languages</TableHead>
                        <TableHead className="font-semibold text-foreground h-14">Status</TableHead>
                        <TableHead className="w-[60px] font-semibold text-foreground h-14 pr-6" />
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {orders.map((order) => (
                        <>
                            {/* MAIN ROW */}
                            <TableRow
                                key={order.id}
                                className={cn(
                                    "hover:bg-muted/30 transition-colors",
                                    order.id === highlightId &&
                                    "bg-primary/10 ring-2 ring-primary animate-pulse"
                                )}
                            >

                            <TableCell className="align-middle h-16 pl-6">
                                    <div className="font-medium text-foreground">
                                        #{order.id}
                                    </div>
                                </TableCell>

                                <TableCell className="align-middle h-16">
                                    <div>
                                        <p className="font-medium text-foreground">
                                            {getTranslatorName(order.translator_id)}
                                        </p>
                                        {translatorsCache[order.translator_id]?.email && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {translatorsCache[order.translator_id].email}
                                            </p>
                                        )}
                                    </div>
                                </TableCell>

                                <TableCell className="align-middle h-16">
                                    <div className="flex items-center gap-2">

                                        {/* Source */}
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-foreground border border-border">
      {order.source_language}
    </span>

                                        {/* Arrow */}
                                        <span className="text-muted-foreground text-sm font-medium">
      →
    </span>

                                        {/* Target */}
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
      {order.target_language}
    </span>

                                    </div>
                                </TableCell>


                                <TableCell className="align-middle h-16">
                                    <Badge
                                        variant={getStatusVariant("some")}
                                        className="transition-smooth hover-lift"
                                    >
                                        {order.status_name}
                                    </Badge>
                                </TableCell>

                                <TableCell className="align-middle h-16 pr-6">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleToggle(order.id)}
                                        className="transition-smooth hover:bg-muted/50 rounded-full w-8 h-8 p-0"
                                    >
                                        {expandedId === order.id ? (
                                            <ChevronUp className="h-4 w-4 transition-spring" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4 transition-spring" />
                                        )}
                                    </Button>
                                </TableCell>
                            </TableRow>

                            {/* EXPANDED ROW */}
                            {expandedId === order.id && (
                                <TableRow className="bg-muted/30 border-b-0">
                                    <TableCell colSpan={5} className="p-0 border-b-0">
                                        <div
                                            className="animate-expand-row"
                                            style={{ overflow: 'hidden' }}
                                        >
                                            <div className="px-6 py-6">
                                                {loadingId === order.id ? (
                                                    <div className="flex items-center justify-center gap-3 py-8">
                                                        <div className="loading-spinner" />
                                                        <p className="text-sm text-muted-foreground">
                                                            Loading details...
                                                        </p>
                                                    </div>
                                                ) : (
                                                    details && (
                                                        <div className="space-y-6">
                                                            {/* Grid items */}
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-background/50 hover-lift transition-smooth">
                                                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                                        Pages
                                                                    </span>
                                                                    <span className="text-xl font-bold text-foreground">
                                                                        {details.page_count}
                                                                    </span>
                                                                </div>

                                                                <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-background/50 hover-lift transition-smooth">
                                                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                                        Images
                                                                    </span>
                                                                    <span className="text-xl font-bold text-foreground">
                                                                        {details.images_count}
                                                                    </span>
                                                                </div>

                                                                <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-background/50 hover-lift transition-smooth">
                                                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                                        Chars (with spaces)
                                                                    </span>
                                                                    <span className="text-xl font-bold text-foreground">
                                                                        {details.chars_with_spaces}
                                                                    </span>
                                                                </div>

                                                                <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-background/50 hover-lift transition-smooth">
                                                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                                        Chars (no spaces)
                                                                    </span>
                                                                    <span className="text-xl font-bold text-foreground">
                                                                        {details.chars_no_spaces}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="pt-4 border-t border-border/50 space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-sm font-medium text-foreground">Image OCR</p>

                                                                    <Button
                                                                        size="sm"
                                                                        variant="secondary"
                                                                        disabled={analyzeLoadingId === order.id}
                                                                        onClick={() => handleAnalyzeImages(order.id)}
                                                                    >
                                                                        {analyzeLoadingId === order.id ? "Analyzing..." : "Analyze images"}
                                                                    </Button>
                                                                </div>

                                                                {analyzeResult?.order_id === order.id && (
                                                                    <div className="space-y-2">
                                                                        {analyzeResult.results.length === 0 ? (
                                                                            <p className="text-sm text-muted-foreground">
                                                                                No supported files (pdf/docx) found.
                                                                            </p>
                                                                        ) : (
                                                                            analyzeResult.results.map((r) => (
                                                                                <div key={r.file_id} className="border rounded-md p-3 bg-background/50">
                                                                                    <div className="text-sm">
                                                                                        <b>file_id:</b> {r.file_id}{" "}
                                                                                        {r.file_type ? `(${r.file_type})` : ""}
                                                                                    </div>

                                                                                    {r.error ? (
                                                                                        <div className="text-sm text-destructive mt-1">{r.error}</div>
                                                                                    ) : (
                                                                                        <div className="text-sm mt-1 space-y-1">
                                                                                            <div>
                                                                                                images: {r.images_found ?? 0} • symbols:{" "}
                                                                                                {r.detected_symbols_from_images ?? 0}
                                                                                            </div>
                                                                                            {r.preview_text && (
                                                                                                <div className="whitespace-pre-wrap">{r.preview_text}</div>
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            ))
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/*<div className="pt-4 border-t border-border/50">*/}
                                                            {/*    <div className="flex items-center justify-between">*/}
                                                            {/*        <div className="space-y-1">*/}
                                                            {/*            <p className="text-sm font-medium text-foreground">*/}
                                                            {/*                Order Details*/}
                                                            {/*            </p>*/}
                                                            {/*            <p className="text-sm text-muted-foreground">*/}
                                                            {/*                Complete order information*/}
                                                            {/*            </p>*/}
                                                            {/*        </div>*/}
                                                            {/*        <a*/}
                                                            {/*            href={details.full_url}*/}
                                                            {/*            target="_blank"*/}
                                                            {/*            rel="noopener noreferrer"*/}
                                                            {/*            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/15 transition-smooth hover:gap-3"*/}
                                                            {/*        >*/}
                                                            {/*            <span>Open translator link</span>*/}
                                                            {/*            <svg*/}
                                                            {/*                className="h-4 w-4 transition-smooth group-hover:translate-x-0.5 group-hover:-translate-y-0.5"*/}
                                                            {/*                fill="none"*/}
                                                            {/*                stroke="currentColor"*/}
                                                            {/*                viewBox="0 0 24 24"*/}
                                                            {/*            >*/}
                                                            {/*                <path*/}
                                                            {/*                    strokeLinecap="round"*/}
                                                            {/*                    strokeLinejoin="round"*/}
                                                            {/*                    strokeWidth={2}*/}
                                                            {/*                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"*/}
                                                            {/*                />*/}
                                                            {/*            </svg>*/}
                                                            {/*        </a>*/}
                                                            {/*    </div>*/}
                                                            {/*</div>*/}
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}