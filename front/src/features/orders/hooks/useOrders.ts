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

    // 👉 ДОДАНО: Стан для збереження поточного фільтру "тільки мої"
    const [isOnlyMineFilter, setIsOnlyMineFilter] = useState(false)

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

    const [pricePreview, setPricePreview] = useState<{
        total_price: number
        client_price: number
        translator_price: number
        margin: number
    } | null>(null)

    const [pricePreviewLoading, setPricePreviewLoading] = useState(false)

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

    const previewPrice = useCallback(async (data: {
        files: File[]
        traffic_id: number
        translator_id?: number
        translator_traffic_id?: number
        source_language_id?: number
    }) => {
        try {
            setPricePreviewLoading(true)
            const formData = new FormData()
            data.files.forEach(file => formData.append("files", file))
            formData.append("traffic_id", String(data.traffic_id))

            if (data.translator_id) {
                formData.append("translator_id", String(data.translator_id))
            }
            if (data.translator_traffic_id) {
                formData.append("translator_traffic_id", String(data.translator_traffic_id))
            }
            if (data.source_language_id) {
                formData.append("source_language_id", String(data.source_language_id))
            }

            const res = await ordersApi.previewPrice(formData)
            setPricePreview(res)
            return res
        } catch (e) {
            handleError(e, "Failed to calculate price")
        } finally {
            setPricePreviewLoading(false)
        }
    }, [handleError])

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

    // 👉 ДОДАНО: параметр onlyMine (за замовчуванням false)
    const loadOrders = useCallback(async (pageNumber: number = 1, onlyMine: boolean = false) => {
        try {
            setLoading(true)

            // Передаємо параметр в API
            const res = await ordersApi.listOrders(pageNumber, onlyMine)

            setOrders(res.results)
            setOrders([...res.results].reverse())
            setTotalPages(Math.ceil(res.count / 10))
            setPage(pageNumber)
            setIsOnlyMineFilter(onlyMine) // Оновлюємо стейт фільтра

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



    const refreshTranslators = useCallback(async () => {
        try {
            const res = await ordersApi.list()
            setTranslators(res.results)

            const cache: Record<number, Translator> = {}
            res.results.forEach(t => {
                cache[t.id] = t
            })
            setTranslatorsCache(cache)
        } catch (e) {
            handleError(e, "Failed to refresh translators")
        }
    }, [handleError])


    /* ======================
       DELETE ORDER
    ====================== */

    const deleteOrder = useCallback(async (orderId: number) => {
        try {
            setDeleteLoading(orderId)
            await ordersApi.deleteOrder(orderId)
            handleSuccess("Deleted", `Order #${orderId} deleted`)

            // 👉 Оновлюємо з урахуванням поточного фільтра
            await loadOrders(page, isOnlyMineFilter)
        } catch (e) {
            handleError(e, "Failed to delete order")
        } finally {
            setDeleteLoading(null)
        }
    }, [page, isOnlyMineFilter, loadOrders, handleError, handleSuccess])


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

            // 👉 Оновлюємо з урахуванням поточного фільтра
            await loadOrders(page, isOnlyMineFilter)
        } catch (e) {
            handleError(e, "Failed to update order")
        } finally {
            setUpdateLoading(null)
        }
    }, [page, isOnlyMineFilter, loadOrders, handleError, handleSuccess])


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
            await loadOrders(1)
            router.push("/dashboard/orders")
            return res
        } catch (e) {
            handleError(e, "Failed to create order")
            throw e
        } finally {
            setLoading(false)
        }
    }, [handleError, handleSuccess, router, loadOrders])


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
        loadOrders(1, false) // За замовчуванням вантажимо ВСІ ордери
    }, [])

    const onPageChange = (newPage: number) => {
        loadOrders(newPage, isOnlyMineFilter)
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
        isOnlyMineFilter, // 👉 Експортуємо стан фільтра, щоб використати в UI

        createOrder,
        loadOrders,
        loadOrderDetails,

        deleteOrder,
        updateOrder,

        downloadOrderSourceFiles,
        downloadOrderTargetFiles,

        loadInitialData,
        refreshTranslators,
        onPageChange,
        getTranslatorById,

        selectedTranslatorId,
        setSelectedTranslatorId,
        pricePreview,
        pricePreviewLoading,
        previewPrice,
    }
}