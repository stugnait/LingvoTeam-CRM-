"use client"

import { Button } from "@/src/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/src/components/ui/card"
import { Plus } from "lucide-react"

import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select"
import { Input } from "@/src/components/ui/input"

/* -------------------------
   Hardcoded data
-------------------------- */

const ORDERS = [
    {
        id: 101,
        client: "Acme Corp",
        language: "EN → UA",
        status: "In translation",
        pages: 12,
        symbols: 18450,
        created_at: "2025-01-10",
    },
    {
        id: 102,
        client: "Lingvo School",
        language: "DE → EN",
        status: "Pending",
        pages: 5,
        symbols: 7200,
        created_at: "2025-01-12",
    },
    {
        id: 103,
        client: "Legal Group",
        language: "FR → UA",
        status: "Completed",
        pages: 30,
        symbols: 45600,
        created_at: "2025-01-15",
    },
]

/* -------------------------
   Page
-------------------------- */

export function OrdersPage() {
    return (
        <>
            <DashboardHeader />

            <main className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-6xl space-y-6">
                    {/* Page Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">
                                Orders
                            </h2>
                            <p className="text-muted-foreground">
                                Manage translation orders and workflows
                            </p>
                        </div>

                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Order
                        </Button>
                    </div>

                    {/* Filters */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Filters</CardTitle>
                            <CardDescription>
                                Filter orders by status or client
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <Input placeholder="Search by client..." />

                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">
                                        Pending
                                    </SelectItem>
                                    <SelectItem value="in_translation">
                                        In translation
                                    </SelectItem>
                                    <SelectItem value="completed">
                                        Completed
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Language pair" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en-ua">
                                        EN → UA
                                    </SelectItem>
                                    <SelectItem value="de-en">
                                        DE → EN
                                    </SelectItem>
                                    <SelectItem value="fr-ua">
                                        FR → UA
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    {/* Orders Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Orders List</CardTitle>
                            <CardDescription>
                                All orders currently in the system
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-0">
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/50">
                                <tr className="text-left">
                                    <th className="px-4 py-3">ID</th>
                                    <th className="px-4 py-3">Client</th>
                                    <th className="px-4 py-3">
                                        Language
                                    </th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">
                                        Pages
                                    </th>
                                    <th className="px-4 py-3">
                                        Symbols
                                    </th>
                                    <th className="px-4 py-3">
                                        Created
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        Actions
                                    </th>
                                </tr>
                                </thead>

                                <tbody>
                                {ORDERS.map((order) => (
                                    <tr
                                        key={order.id}
                                        className="border-b hover:bg-muted/30"
                                    >
                                        <td className="px-4 py-3">
                                            #{order.id}
                                        </td>
                                        <td className="px-4 py-3">
                                            {order.client}
                                        </td>
                                        <td className="px-4 py-3">
                                            {order.language}
                                        </td>
                                        <td className="px-4 py-3">
                                            {order.status}
                                        </td>
                                        <td className="px-4 py-3">
                                            {order.pages}
                                        </td>
                                        <td className="px-4 py-3">
                                            {order.symbols.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            {order.created_at}
                                        </td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                            >
                                                View
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                            >
                                                Edit
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    )
}
