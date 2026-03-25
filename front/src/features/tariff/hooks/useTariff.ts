"use client"

import { useCallback, useEffect, useState } from "react"
import { useToast } from "@/src/hooks/use-toast"
import { tariffApi } from "../api"
import { ordersApi } from "@/src/features/orders/api"

import type {
    Tariff,
    TariffsFormData,
    Categories
} from "../types"

import type {
    Currency,
    Language,
} from "@/src/features/orders/types"

export function useTariffs() {
    const { toast } = useToast()

    const [allTariffs, setAllTariffs] = useState<Tariff[]>([])
    const [currencies, setCurrencies] = useState<Currency[]>([])
    const [languages, setLanguages] = useState<Language[]>([])
    const [categories, setCategories] = useState<Categories[]>([])

    const [loading, setLoading] = useState(false)

    const [selectedTariff, setSelectedTariff] = useState<Tariff | null>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)

    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const [form, setForm] = useState<TariffsFormData>({
        name: "",
        language_pair: 0,
        currency_id: 0,
        category: 0,
        price_per_page: "",
        price_per_action: "",
    })

    const openDeleteTariff = (tariff: Tariff) => {
        setSelectedTariff(tariff)
        setIsDeleteOpen(true)
    }

    const closeModals = () => {
        setIsFormOpen(false)
        setIsDeleteOpen(false)
        setSelectedTariff(null)
    }

    const confirmDelete = async () => {
        if (!selectedTariff) {return}

        try {
            await tariffApi.deleteTariff(selectedTariff.id)

            toast({
                title: "Tariff deleted",
                description: `${selectedTariff.name} removed`,
            })

            closeModals()
            await loadTariffs(page)
        } catch {
            toast({
                title: "Error",
                description: "Failed to delete tariff",
                variant: "error",
            })
        }
    }

    // -------------------------
    // Load tariffs
    // -------------------------
    const loadTariffs = useCallback(async (pageNumber: number = 1) => {
        try {
            const response = await tariffApi.listTariff(pageNumber)
            setAllTariffs(response.results)
            setTotalPages(Math.ceil((response.count || 0) / 10))
            setPage(pageNumber)
        } catch {
            toast({
                title: "Error",
                description: "Failed to load tariffs",
                variant: "error",
            })
        }
    }, [toast])

    const onPageChange = (newPage: number) => {
        loadTariffs(newPage)
    }

    // -------------------------
    // Load currencies
    // -------------------------
    const loadCurrencies = useCallback(async () => {
        try {
            const response = await ordersApi.listCurrency()
            setCurrencies(response.results)
        } catch {
            toast({
                title: "Error",
                description: "Failed to load currencies",
                variant: "error",
            })
        }
    }, [toast])

    const loadCategories = useCallback(async () => {
        try {
            const response = await tariffApi.listCategories()
            setCategories(response.results)
        } catch {
            toast({
                title: "Error",
                description: "Failed to load currencies",
                variant: "error",
            })
        }
    }, [toast])

    // -------------------------
    // Load languages
    // -------------------------
    const loadLanguages = useCallback(async () => {
        try {
            const response = await ordersApi.listLanguages()
            setLanguages(response.results)
        } catch {
            toast({
                title: "Error",
                description: "Failed to load languages",
                variant: "error",
            })
        }
    }, [toast])

    // -------------------------
    // Initial load
    // -------------------------
    useEffect(() => {
        const init = async () => {
            setLoading(true)
            await Promise.all([
                loadTariffs(1),
                loadCurrencies(),
                loadLanguages(),
                loadCategories()
            ])
            setLoading(false)
        }

        init()
    }, [loadTariffs, loadCurrencies, loadLanguages, loadCategories])

    // -------------------------
    // Modal handlers
    // -------------------------
    const openAddTariff = () => {
        setSelectedTariff(null)
        setForm({
            name: "",
            language_pair: 0,
            currency_id: 0,
            category: 0,
            price_per_page: "",
            price_per_action: "",
        })
        setIsFormOpen(true)
    }

    const openEditTariff = (tariff: Tariff) => {
        setSelectedTariff(tariff)
        setForm({
            name: tariff.name,
            language_pair: tariff.language_pair,
            currency_id: tariff.currency_id,
            category: tariff.category,
            price_per_page: tariff.price_per_page,
            price_per_action: tariff.price_per_action,
        })
        setIsFormOpen(true)
    }


    // -------------------------
    // Submit
    // -------------------------
    const submitTariff = async (data: TariffsFormData) => {
        try {
            // -------- Validation --------
            if (!data.name.trim()) {
                toast({
                    title: "Validation error",
                    description: "Tariff name is required",
                    variant: "error",
                })
                return
            }

            if (
                !data.price_per_page ||
                Number(data.price_per_page) <= 0
            ) {
                toast({
                    title: "Validation error",
                    description: "Price per page must be greater than 0",
                    variant: "error",
                })
                return
            }

            if (
                !data.price_per_action ||
                Number(data.price_per_action) <= 0
            ) {
                toast({
                    title: "Validation error",
                    description: "Price per action must be greater than 0",
                    variant: "error",
                })
                return
            }

            // -------- Transform payload --------
            const payload = {
                ...data,
                price_per_page: Number(data.price_per_page),
                price_per_action: Number(data.price_per_action),
            }

            // -------- API --------
            if (selectedTariff) {
                await tariffApi.updateTariff(
                    selectedTariff.id,
                    JSON.stringify(payload)
                )

                toast({
                    title: "Tariff updated",
                    description: `${data.name} updated successfully`,
                })
            } else {
                await tariffApi.createTariff(
                    JSON.stringify(payload)
                )

                toast({
                    title: "Tariff created",
                    description: `${data.name} created successfully`,
                })
            }

            closeModals()
            await loadTariffs(page)
        } catch {
            toast({
                title: "Error",
                description: "Failed to save tariff",
                variant: "error",
            })
        }
    }

    return {
        tariffs: allTariffs,
        currencies,
        categories,
        languages,
        loading,
        isDeleteOpen,
        openDeleteTariff,
        confirmDelete,

        form,
        setForm,

        selectedTariff,
        isFormOpen,

        openAddTariff,
        openEditTariff,
        closeModals,
        submitTariff,
        page,
        totalPages,
        onPageChange,
    }
}