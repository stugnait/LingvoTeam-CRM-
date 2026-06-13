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
    const [updateClientStatusLoading, setUpdateClientStatusLoading] = useState<number | null>(null) // 👉 ДОДАНО

    const [sourceFiles, setSourceFiles] = useState<{ id: number; name: string }[]>([])
    const [targetFiles, setTargetFiles] = useState<{ id: number; name: string }[]>([])
    const [filesLoading, setFilesLoading] = useState(false)
    const [downloadLoading, setDownloadLoading] = useState(false)
    const [searchFilter, setSearchFilter] = useState<string>("")

    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const [isOnlyMineFilter, setIsOnlyMineFilter] = useState(false)
    const [statusFilter, setStatusFilter] = useState<string | number>("")
    const [managerFilter, setManagerFilter] = useState<string | number>("")
    const [dateFromFilter, setDateFromFilter] = useState<string>("")
    const [dateToFilter, setDateToFilter] = useState<string>("")

    const [orders, setOrders] = useState<OrderListItem[]>([])
    const [order, setOrder] = useState<CreateOrderResponse | null>(null)
    const [orderDetail, setOrderDetail] = useState<Details | null>(null)

    const [translators, setTranslators] = useState<Translator[]>([])
    const [clients, setClients] = useState<Client[]>([])
    const [languages, setLanguages] = useState<Language[]>([])
    const [editors, setEditors] = useState<Editor[]>([])
    const [managers, setManagers] = useState<Editor[]>([])
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
            const blob = await ordersApi.downloadAllFiles(orderId, "source")
            downloadBlob(blob, `order_${orderId}_source.zip`)
            handleSuccess("Success", "Source files downloaded")
        } catch (e) {
            handleError(e, "Failed to download source files")
        }
    }, [handleError, handleSuccess])

    const downloadOrderTargetFiles = useCallback(async (orderId: number) => {
        try {
            const blob = await ordersApi.downloadAllFiles(orderId, "target")
            downloadBlob(blob, `order_${orderId}_target.zip`)
            handleSuccess("Success", "Target files downloaded")
        } catch (e) {
            handleError(e, "Failed to download target files")
        }
    }, [handleError, handleSuccess])

    const loadOrderFiles = useCallback(async (orderId: number) => {
        setFilesLoading(true)
        try {
            const results = await Promise.allSettled([
                ordersApi.listDownloadFiles(orderId, "source"),
                ordersApi.listDownloadFiles(orderId, "target"),
            ])

            const isFolderEmptyError = (err: any) =>
                typeof err?.detail === "string" &&
                err.detail.includes("Файли") &&
                err.detail.includes("відсутні")

            const [sourceResult, targetResult] = results

            if (sourceResult.status === "fulfilled") {
                setSourceFiles(sourceResult.value.files ?? [])
            } else if (isFolderEmptyError(sourceResult.reason)) {
                setSourceFiles([])
            }

            if (targetResult.status === "fulfilled") {
                setTargetFiles(targetResult.value.files ?? [])
            } else if (isFolderEmptyError(targetResult.reason)) {
                setTargetFiles([])
            }
        } finally {
            setFilesLoading(false)
        }
    }, [])

    const downloadSingleSourceFile = useCallback(async (orderId: number, fileId: number, filename: string) => {
        try {
            setDownloadLoading(true)
            const blob = await ordersApi.downloadFile(orderId, "source", fileId)
            downloadBlob(blob, filename)
            handleSuccess("Success", "File downloaded")
        } catch (e) {
            handleError(e, "Failed to download source file")
        } finally {
            setDownloadLoading(false)
        }
    }, [handleError, handleSuccess])

    const downloadSingleTargetFile = useCallback(async (orderId: number, fileId: number, filename: string) => {
        try {
            setDownloadLoading(true)
            const blob = await ordersApi.downloadFile(orderId, "target", fileId)
            downloadBlob(blob, filename)
            handleSuccess("Success", "File downloaded")
        } catch (e) {
            handleError(e, "Failed to download target file")
        } finally {
            setDownloadLoading(false)
        }
    }, [handleError, handleSuccess])


    /* ======================
       LOAD ORDERS
    ====================== */

    const loadOrders = useCallback(async (
        pageNumber: number = 1,
        onlyMine: boolean = isOnlyMineFilter,
        status: string | number = statusFilter,
        manager: string | number = managerFilter,
        dateFrom: string = dateFromFilter,
        dateTo: string = dateToFilter,
        search: string = searchFilter
    ) => {
        try {
            setLoading(true)

            const res = await ordersApi.listOrders({
                page: pageNumber,
                my_orders: onlyMine,
                status: status || undefined,
                manager: manager || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                search: search || undefined
            })

            const sortedResults = [...res.results].sort((a, b) => b.id - a.id)
            setOrders(sortedResults)

            setTotalPages(Math.ceil((res.count || 0) / 10))
            setPage(pageNumber)

            setIsOnlyMineFilter(onlyMine)
            setStatusFilter(status)
            setManagerFilter(manager)
            setDateFromFilter(dateFrom)
            setDateToFilter(dateTo)
            setSearchFilter(search)

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
    }, [handleError, languagePairs, isOnlyMineFilter, statusFilter, managerFilter, dateFromFilter, dateToFilter, searchFilter])



    const handleStatusChange = (val: string | number) => {
        setStatusFilter(val)
        loadOrders(1, isOnlyMineFilter, val, managerFilter, dateFromFilter, dateToFilter, searchFilter)
    }

    const handleManagerChange = (val: string | number) => {
        setManagerFilter(val)
        loadOrders(1, isOnlyMineFilter, statusFilter, val, dateFromFilter, dateToFilter, searchFilter)
    }

    const handleFilterChange = (onlyMine: boolean) => {
        setIsOnlyMineFilter(onlyMine)
        loadOrders(1, onlyMine, statusFilter, managerFilter, dateFromFilter, dateToFilter, searchFilter)
    }

    const handleDateFromChange = (val: string) => {
        setDateFromFilter(val)
        loadOrders(1, isOnlyMineFilter, statusFilter, managerFilter, val, dateToFilter, searchFilter)
    }

    const handleDateToChange = (val: string) => {
        setDateToFilter(val)
        loadOrders(1, isOnlyMineFilter, statusFilter, managerFilter, dateFromFilter, val, searchFilter)
    }

    const handleSearchChange = (val: string) => {
        setSearchFilter(val)
        loadOrders(1, isOnlyMineFilter, statusFilter, managerFilter, dateFromFilter, dateToFilter, val)
    }

    const onPageChange = (newPage: number) => {
        loadOrders(newPage, isOnlyMineFilter, statusFilter, managerFilter, dateFromFilter, dateToFilter, searchFilter)
    }

    const refreshTranslators = useCallback(async () => {
        try {
            const res = await ordersApi.list()
            setTranslators(res.results)

            const cache: Record<number, Translator> = {}
            res.results.forEach(t => {
                cache[t.id] = t
            })
            setTranslatorsCache(cache)

            return res.results
        } catch (e) {
            handleError(e, "Failed to refresh translators")
            return []
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
            await loadOrders(page, isOnlyMineFilter, statusFilter, managerFilter, dateFromFilter, dateToFilter)
        } catch (e) {
            handleError(e, "Failed to delete order")
        } finally {
            setDeleteLoading(null)
        }
    }, [page, isOnlyMineFilter, statusFilter, managerFilter, dateFromFilter, dateToFilter, loadOrders, handleError, handleSuccess])

    const confirmOrder = useCallback(async (orderId: number) => {
        try {
            setUpdateLoading(orderId)

            if (ordersApi.confirmOrder) {
                await ordersApi.confirmOrder(orderId)
            } else {
                console.warn("Потрібно реалізувати ordersApi.confirmOrder у файлі api.ts")
            }

            handleSuccess("Confirmed", `Order #${orderId} confirmed successfully`)
            await loadOrders(page, isOnlyMineFilter, statusFilter, managerFilter, dateFromFilter, dateToFilter)
        } catch (e) {
            handleError(e, "Failed to confirm order")
        } finally {
            setUpdateLoading(null)
        }
    }, [page, isOnlyMineFilter, statusFilter, managerFilter, dateFromFilter, dateToFilter, loadOrders, handleError, handleSuccess])


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
            await loadOrders(page, isOnlyMineFilter, statusFilter, managerFilter, dateFromFilter, dateToFilter)
        } catch (e) {
            handleError(e, "Failed to update order")
        } finally {
            setUpdateLoading(null)
        }
    }, [page, isOnlyMineFilter, statusFilter, managerFilter, dateFromFilter, dateToFilter, loadOrders, handleError, handleSuccess])


    /* ======================
       UPDATE CLIENT STATUS (PAYMENT)
    ====================== */

    // 👉 ДОДАНО: логіка для оновлення статусу оплати
    const updateClientStatus = useCallback(async (orderId: number, statusId: number) => {
        try {
            setUpdateClientStatusLoading(orderId)
            await ordersApi.updateClientStatus(orderId, statusId)
            handleSuccess("Updated", `Payment status for Order #${orderId} updated`)
            await loadOrders(page, isOnlyMineFilter, statusFilter, managerFilter, dateFromFilter, dateToFilter, searchFilter)
        } catch (e) {
            handleError(e, "Failed to update payment status")
        } finally {
            setUpdateClientStatusLoading(null)
        }
    }, [page, isOnlyMineFilter, statusFilter, managerFilter, dateFromFilter, dateToFilter, searchFilter, loadOrders, handleError, handleSuccess])


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


    const loadInitialData = useCallback(async () => {
        if (initialLoadedRef.current) {return}
        try {
            setLoading(true)
            const [
                translatorsRes,
                clientsRes,
                languagesRes,
                editorsRes,
                managersRes,
                currenciesRes,
                trafficRes
            ] = await Promise.all([
                ordersApi.list(),
                ordersApi.listClients(),
                ordersApi.listLanguages(),
                ordersApi.listEditors(),
                ordersApi.listManagers(),
                ordersApi.listCurrency(),
                ordersApi.listTraffic()
            ])

            const translatorsData = translatorsRes.results || translatorsRes
            setTranslators(translatorsData as Translator[])

            const cache: Record<number, Translator> = {}
            ;(translatorsData as Translator[]).forEach(t => {
                cache[t.id] = t
            })
            setTranslatorsCache(cache)

            setClients(clientsRes.results || clientsRes as any)
            setLanguages(languagesRes.results || languagesRes as any)
            setEditors(editorsRes.results || editorsRes as any)
            setManagers(managersRes.results || managersRes as any)
            setCurrencies(currenciesRes.results || currenciesRes as any)
            setTraffics(trafficRes.results || trafficRes as any)

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
        loadOrders(1, false, "", "", "", "")
    }, [])

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
        updateClientStatusLoading, // 👉 ДОДАНО

        orders,
        order,
        orderDetail,

        translators,
        clients,
        languages,
        editors,
        managers,
        currencies,
        traffics,

        languagePairs,
        translatorsCache,

        page,
        totalPages,

        isOnlyMineFilter,
        setIsOnlyMineFilter,
        statusFilter,
        setStatusFilter,
        managerFilter,
        setManagerFilter,
        dateFromFilter,
        setDateFromFilter,
        dateToFilter,

        handleFilterChange,
        handleStatusChange,
        handleManagerChange,
        handleDateFromChange,
        handleDateToChange,

        createOrder,
        loadOrders,
        loadOrderDetails,

        deleteOrder,
        updateOrder,
        updateClientStatus, // 👉 ДОДАНО
        confirmOrder,

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
        sourceFiles,
        targetFiles,
        filesLoading,
        downloadLoading,
        loadOrderFiles,
        downloadSingleSourceFile,
        downloadSingleTargetFile,
        searchFilter,
        handleSearchChange
    }
}