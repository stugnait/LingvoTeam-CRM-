"use client"

import { useState } from "react"
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
} from "@/src/features/orders/types"

interface OrdersTableProps {
    orders: OrderListItem[]
    onOpen: (orderId: number) => Promise<CreateOrderResponse>
}

export function OrdersTable({ orders, onOpen }: OrdersTableProps) {
    const [expandedId, setExpandedId] = useState<number | null>(null)
    const [details, setDetails] = useState<CreateOrderResponse | null>(null)
    const [loadingId, setLoadingId] = useState<number | null>(null)

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

    const getStatusVariant = (status: string) =>
        status === "completed" ? "default" : "secondary"

    return (
        <div className="border border-border rounded-lg bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">ID</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Languages</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[60px]" />
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {orders.map((order) => (
                        <>
                            {/* MAIN ROW */}
                            <TableRow key={order.id}>
                                <TableCell>
                                    #{order.id}
                                </TableCell>

                                <TableCell>
                                    Client {order.client_id}
                                </TableCell>

                                <TableCell>
                                    {order.source_language} →{" "}
                                    {order.target_language}
                                </TableCell>

                                <TableCell>
                                    <Badge
                                        variant={getStatusVariant(order.status)}
                                    >
                                        {order.status}
                                    </Badge>
                                </TableCell>

                                <TableCell>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleToggle(order.id)}
                                    >
                                        {expandedId === order.id ? (
                                            <ChevronUp className="h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4" />
                                        )}
                                    </Button>
                                </TableCell>
                            </TableRow>

                            {/* EXPANDED ROW */}
                            {expandedId === order.id && (
                                <TableRow className="bg-muted/50">
                                    <TableCell colSpan={5}>
                                        {loadingId === order.id ? (
                                            <p className="text-sm text-muted-foreground">
                                                Loading details...
                                            </p>
                                        ) : (
                                            details && (
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <b>Pages:</b>{" "}
                                                        {
                                                            details.stats
                                                                .physical_pages
                                                        }
                                                    </div>
                                                    <div>
                                                        <b>Images:</b>{" "}
                                                        {
                                                            details.stats
                                                                .images_count
                                                        }
                                                    </div>
                                                    <div>
                                                        <b>Chars (with spaces):</b>{" "}
                                                        {
                                                            details.stats
                                                                .chars_with_spaces
                                                        }
                                                    </div>
                                                    <div>
                                                        <b>Chars (no spaces):</b>{" "}
                                                        {
                                                            details.stats
                                                                .chars_no_spaces
                                                        }
                                                    </div>

                                                    <div className="col-span-2 pt-2">
                                                        <a
                                                            href={
                                                                details
                                                                    .translator_link
                                                                    .full_url
                                                            }
                                                            target="_blank"
                                                            className="underline"
                                                        >
                                                            Translator link
                                                        </a>
                                                    </div>
                                                </div>
                                            )
                                        )}
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
