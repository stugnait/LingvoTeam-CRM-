"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"
import { useOrders } from "../hooks/useOrders"
import { useState } from "react"

export function CreateOrderForm() {
    const { createOrder, loading } = useOrders()
    const [files, setFiles] = useState<File[]>([])

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create order</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                <Input
                    type="file"
                    multiple
                    onChange={(e) =>
                        setFiles(Array.from(e.target.files || []))
                    }
                />

                <Button
                    disabled={loading}
                    onClick={() =>
                        createOrder({
                            client_id: 1,
                            source_language: 1,
                            target_language: 2,
                            traffic_id: 1,
                            files,
                        })
                    }
                >
                    {loading ? "Creating..." : "Create order"}
                </Button>
            </CardContent>
        </Card>
    )
}
