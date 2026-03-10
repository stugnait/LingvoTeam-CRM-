"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ordersApi } from "../api"
import {
    CreateOrderPayload,
    CreateOrderResponse,
    OrderListItem,
    Details,
    LanguagePair,
    Translator,
    Client,
    Language,
    Editor,
    Currency,
    OrderTraffic,
} from "../types"

import { useToast } from "@/src/hooks/use-toast"
import { useRouter } from "next/navigation"

export function useOrders() {

    const { toast } = useToast()
    const router = useRouter()

    /* ======================
       STATE
    ====================== */

    const [loading, setLoading] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState<number | null>(null)
    const [updateLoading, setUpdateLoading] = useState<number | null>(null)

    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const [orders, setOrders] = useState<OrderListItem[]>([])
    const [order, setOrder] = useState<CreateOrderResponse | null>(null)
    const [orderDetail, setOrderDetail] = useState<Details | null>(null)

    const [translators, setTranslators] = useState<Translator[]>([])
    const [clients, setClients] = useState<Client[]>([])
    const [languages, setLanguages] = useState<Language[]>([])
    const [editors, setEditors] = useState<Editor[]>([])
    const [currencies, setCurrencies] = useState<Currency[]>([])
    const [traffics, setTraffics] = useState<OrderTraffic[]>([])

    const [languagePairs, setLanguagePairs] = useState<Record<number, LanguagePair>>({})
    const [translatorsCache, setTranslatorsCache] = useState<Record<number, Translator>>({})

    const [selectedTranslatorId, setSelectedTranslatorId] = useState<number | null>(null)

    const initialLoadedRef = useRef(false)

    /* ======================
       TOAST HELPERS
    ====================== */

    const handleError = useCallback((e: any, fallback: string) => {

        toast({
            title: "Error",
            description: e?.detail || fallback,
            variant: "error"
        })

    }, [toast])


    const handleSuccess = useCallback((title: string, description: string) => {

        toast({
            title,
            description,
            variant: "success"
        })

    }, [toast])


    /* ======================
       FILE DOWNLOAD
    ====================== */

    const downloadBlob = (blob: Blob, filename: string) => {

        const url = URL.createObjectURL(blob)

        const a = document.createElement("a")
        a.href = url
        a.download = filename

        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        URL.revokeObjectURL(url)
    }

    const downloadOrderSourceFiles = useCallback(async (orderId: number) => {

        try {

            const blob = await ordersApi.downloadFilesSource(orderId)
            downloadBlob(blob, `order_${orderId}_source.zip`)

            handleSuccess("Success", "Source files downloaded")

        } catch (e) {

            handleError(e, "Failed to download source files")

        }

    }, [handleError, handleSuccess])


    const downloadOrderTargetFiles = useCallback(async (orderId: number) => {

        try {

            const blob = await ordersApi.downloadFilesTarget(orderId)
            downloadBlob(blob, `order_${orderId}_target.zip`)

            handleSuccess("Success", "Target files downloaded")

        } catch (e) {

            handleError(e, "Failed to download target files")

        }

    }, [handleError, handleSuccess])


    /* ======================
       LOAD ORDERS
    ====================== */

    const loadOrders = useCallback(async (pageNumber: number = 1) => {

        try {

            setLoading(true)

            const res = await ordersApi.listOrders(pageNumber)

            setOrders(res.results)

            setTotalPages(Math.ceil(res.count / 10))
            setPage(pageNumber)

            const pairIds = [...new Set(res.results.map(o => o.language_pair_id))]

            const missing = pairIds.filter(id => !languagePairs[id])

            if (missing.length) {

                const pairs = await Promise.all(
                    missing.map(id => ordersApi.getLanguagePairById(id))
                )

                setLanguagePairs(prev => {

                    const updated = { ...prev }

                    pairs.forEach(p => {
                        updated[p.id] = p
                    })

                    return updated
                })
            }

        } catch (e) {

            handleError(e, "Failed to load orders")

        } finally {

            setLoading(false)

        }

    }, [handleError, languagePairs])


    /* ======================
       DELETE ORDER
    ====================== */

    const deleteOrder = useCallback(async (orderId: number) => {

        try {

            setDeleteLoading(orderId)

            await ordersApi.deleteOrder(orderId)

            handleSuccess("Deleted", `Order #${orderId} deleted`)

            await loadOrders(page)

        } catch (e) {

            handleError(e, "Failed to delete order")

        } finally {

            setDeleteLoading(null)

        }

    }, [page, loadOrders, handleError, handleSuccess])


    /* ======================
       UPDATE ORDER
    ====================== */

    const updateOrder = useCallback(async (orderId: number, data: Partial<CreateOrderPayload>) => {

        try {

            setUpdateLoading(orderId)

            const formData = new FormData()

            Object.entries(data).forEach(([key, value]) => {

                if (value === undefined || value === null) {return}

                if (key === "files" && Array.isArray(value)) {

                    value.forEach(file => formData.append("files", file))

                } else {

                    formData.append(key, String(value))

                }

            })

            await ordersApi.updateOrder(orderId, formData)

            handleSuccess("Updated", `Order #${orderId} updated`)

            await loadOrders(page)

        } catch (e) {

            handleError(e, "Failed to update order")

        } finally {

            setUpdateLoading(null)

        }

    }, [page, loadOrders, handleError, handleSuccess])


    /* ======================
       CREATE ORDER
    ====================== */

    const createOrder = useCallback(async (data: CreateOrderPayload) => {

        try {

            setLoading(true)

            const formData = new FormData()

            Object.entries(data).forEach(([key, value]) => {

                if (value === undefined || value === null) {return}

                if (key === "files" && Array.isArray(value)) {

                    value.forEach(file => formData.append("files", file))

                } else {

                    formData.append(key, String(value))

                }

            })

            const res = await ordersApi.create(formData)

            setOrder(res)

            handleSuccess("Order created", `Order #${res.order_id}`)

            router.push("/dashboard/orders")

            return res

        } catch (e) {

            handleError(e, "Failed to create order")
            throw e

        } finally {

            setLoading(false)

        }

    }, [handleError, handleSuccess, router])


    /* ======================
       ORDER DETAILS
    ====================== */

    const loadOrderDetails = useCallback(async (orderId: number) => {

        try {

            setLoading(true)

            const res = await ordersApi.getById(orderId)

            setOrderDetail(res)

            return res

        } catch (e) {

            handleError(e, "Failed to load order")

            throw e

        } finally {

            setLoading(false)

        }

    }, [handleError])


    /* ======================
       INITIAL DATA
    ====================== */

    const loadInitialData = useCallback(async () => {

        if (initialLoadedRef.current) {return}

        try {

            setLoading(true)

            const [
                translatorsRes,
                clientsRes,
                languagesRes,
                editorsRes,
                currenciesRes,
                trafficRes
            ] = await Promise.all([
                ordersApi.list(),
                ordersApi.listClients(),
                ordersApi.listLanguages(),
                ordersApi.listEditors(),
                ordersApi.listCurrency(),
                ordersApi.listTraffic()
            ])

            setTranslators(translatorsRes.results)

            const cache: Record<number, Translator> = {}

            translatorsRes.results.forEach(t => {
                cache[t.id] = t
            })

            setTranslatorsCache(cache)

            setClients(clientsRes.results)
            setLanguages(languagesRes.results)
            setEditors(editorsRes.results)
            setCurrencies(currenciesRes.results)
            setTraffics(trafficRes.results)

            initialLoadedRef.current = true

        } catch (e) {

            handleError(e, "Failed to load initial data")

        } finally {

            setLoading(false)

        }

    }, [handleError])


    /* ======================
       EFFECT
    ====================== */

    useEffect(() => {

        loadInitialData()
        loadOrders(1)

    }, [])


    const onPageChange = (newPage: number) => {
        loadOrders(newPage)
    }


    const getTranslatorById = useCallback((id: number | null) => {

        if (!id) {return null}
        return translatorsCache[id] || null

    }, [translatorsCache])


    /* ======================
       RETURN
    ====================== */

    return {

        loading,
        deleteLoading,
        updateLoading,

        orders,
        order,
        orderDetail,

        translators,
        clients,
        languages,
        editors,
        currencies,
        traffics,

        languagePairs,
        translatorsCache,

        page,
        totalPages,

        createOrder,
        loadOrders,
        loadOrderDetails,

        deleteOrder,
        updateOrder,

        downloadOrderSourceFiles,
        downloadOrderTargetFiles,

        loadInitialData,

        onPageChange,

        getTranslatorById,

        selectedTranslatorId,
        setSelectedTranslatorId

    }
}