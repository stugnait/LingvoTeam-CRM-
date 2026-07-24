"use client"

import { useCallback, useEffect, useState } from "react"
import { useToast } from "@/src/hooks/use-toast"
import { tariffApi, languagePairApi } from "../api"
import { ordersApi } from "@/src/features/orders/api"

import type { Tariff, TariffsFormData, Categories } from "../types"
import type { Currency, Language, LanguagePair } from "@/src/features/orders/types"

export function useTariffs() {
    const { toast } = useToast()

    const [allTariffs, setAllTariffs] = useState<Tariff[]>([])
    const [currencies, setCurrencies] = useState<Currency[]>([])
    const [languages, setLanguages] = useState<Language[]>([])
    const [categories, setCategories] = useState<Categories[]>([])
    const [languagePairs, setLanguagePairs] = useState<LanguagePair[]>([])

    const [loading, setLoading] = useState(false)

    const [selectedTariff, setSelectedTariff] = useState<Tariff | null>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)

    const [isNewPairModalOpen, setIsNewPairModalOpen] = useState(false)
    const [newPairForm, setNewPairForm] = useState({ source_language: 0, target_language: 0 })
    const [newPairLoading, setNewPairLoading] = useState(false)

    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const [form, setForm] = useState<TariffsFormData>({
        name: "",
        language_pair_id: 0,
        source_language: 0,
        target_language: 0,
        price_type: "",
        currency_id: 0,
        category: 0,
        price_per_page: "",
        price_per_action: "",
    })

    const [errors, setErrors] = useState<Partial<Record<keyof TariffsFormData, string>>>({})

    // -------------------------
    // Load
    // -------------------------
    const loadTariffs = useCallback(async (pageNumber: number = 1) => {
        try {
            const response = await tariffApi.listTariff(pageNumber)
            setAllTariffs(response.results)
            setTotalPages(Math.ceil((response.count || 0) / 10))
            setPage(pageNumber)
        } catch {
            toast({ title: "Error", description: "Failed to load tariffs", variant: "error" })
        }
    }, [toast])

    const loadCurrencies = useCallback(async () => {
        try {
            const response = await ordersApi.listCurrency()
            setCurrencies(response.results)
        } catch {
            toast({ title: "Error", description: "Failed to load currencies", variant: "error" })
        }
    }, [toast])

    const loadCategories = useCallback(async () => {
        try {
            const response = await tariffApi.listCategories()
            setCategories(response.results)
        } catch {
            toast({ title: "Error", description: "Failed to load categories", variant: "error" })
        }
    }, [toast])

    const loadLanguages = useCallback(async () => {
        try {
            const response = await ordersApi.listLanguages()
            setLanguages(response.results || response)
        } catch {
            toast({ title: "Error", description: "Failed to load languages", variant: "error" })
        }
    }, [toast])

    const loadLanguagePairs = useCallback(async () => {
        try {
            const response = await languagePairApi.list()
            setLanguagePairs(response.results)
        } catch {
            toast({ title: "Error", description: "Failed to load language pairs", variant: "error" })
        }
    }, [toast])

    useEffect(() => {
        const init = async () => {
            setLoading(true)
            await Promise.all([
                loadTariffs(1),
                loadCurrencies(),
                loadLanguages(),
                loadCategories(),
                loadLanguagePairs(),
            ])
            setLoading(false)
        }
        void init()
    }, [loadTariffs, loadCurrencies, loadLanguages, loadCategories, loadLanguagePairs])

    // -------------------------
    // Modals
    // -------------------------
    const onPageChange = (newPage: number) => {
        void loadTariffs(newPage)
    }

    const openDeleteTariff = (tariff: Tariff) => {
        setSelectedTariff(tariff)
        setIsDeleteOpen(true)
    }

    const closeModals = () => {
        setIsFormOpen(false)
        setIsDeleteOpen(false)
        setSelectedTariff(null)
        setErrors({})
    }

    const openAddTariff = () => {
        setSelectedTariff(null)
        setForm({
            name: "",
            language_pair_id: 0,
            source_language: 0,
            target_language: 0,
            currency_id: 0,
            price_type: "",
            category: 0,
            price_per_page: "",
            price_per_action: "",
        })
        setErrors({})
        setIsFormOpen(true)
    }

    const openEditTariff = (tariff: Tariff) => {
        setSelectedTariff(tariff)
        setForm({
            name: tariff.name,
            language_pair_id: tariff.language_pair?.id ?? 0,
            source_language: tariff.language_pair?.source_language ?? 0,
            target_language: tariff.language_pair?.target_language ?? 0,
            currency_id: tariff.currency_id,
            price_type: "",
            category: tariff.category,
            price_per_page: tariff.price_per_page,
            price_per_action: tariff.price_per_action,
        })
        setErrors({})
        setIsFormOpen(true)
    }

    const confirmDelete = async () => {
        if (!selectedTariff) {return}

        try {
            await tariffApi.deleteTariff(selectedTariff.id)
            toast({ title: "Tariff deleted", description: `${selectedTariff.name} removed` })
            closeModals()
            await loadTariffs(page)
        } catch {
            toast({ title: "Error", description: "Failed to delete tariff", variant: "error" })
        }
    }

    // -------------------------
    // New language pair
    // -------------------------
    const createAndSelectPair = async () => {
        if (!newPairForm.source_language || !newPairForm.target_language) {
            toast({ title: "Error", description: "Select both languages", variant: "error" })
            return
        }
        if (newPairForm.source_language === newPairForm.target_language) {
            toast({ title: "Error", description: "Languages must be different", variant: "error" })
            return
        }

        setNewPairLoading(true)
        try {
            const created = await languagePairApi.create(
                newPairForm.source_language,
                newPairForm.target_language
            )

            await loadLanguagePairs()

            setForm(prev => ({
                ...prev,
                language_pair_id: created.id,
                source_language: newPairForm.source_language,  // ← беремо з форми, бо в LanguagePair немає цих полів
                target_language: newPairForm.target_language,
            }))

            setIsNewPairModalOpen(false)
            setNewPairForm({ source_language: 0, target_language: 0 })  // ← виправлено

            toast({
                title: "Пару створено",
                description: created.pair_name,  // ← просто pair_name
            })
        } catch (err: any) {
            const msg = err?.non_field_errors?.[0]
                ?? err?.detail
                ?? "Failed to create language pair"
            toast({ title: "Помилка", description: msg, variant: "error" })
        } finally {
            setNewPairLoading(false)
        }
    }

    // -------------------------
    // Submit tariff
    // -------------------------
    const submitTariff = async (data: TariffsFormData) => {
        try {
            const newErrors: Partial<Record<keyof TariffsFormData, string>> = {}

            if (!data.name.trim()) {newErrors.name = "Tariff name is required"}
            if (!data.language_pair_id) {newErrors.language_pair_id = "Please select a language pair"}
            if (!data.currency_id) {newErrors.currency_id = "Please select a currency"}
            if (!data.category) {newErrors.category = "Please select a category"}
            const hasPagePrice =
                data.price_per_page !== "" && Number(data.price_per_page) > 0

            const hasActionPrice =
                data.price_per_action !== "" && Number(data.price_per_action) > 0

            if (hasPagePrice === hasActionPrice) {
                newErrors.price_per_page = "Specify either price per page or price per action"
                newErrors.price_per_action = "Specify either price per page or price per action"
            }

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors)
                toast({ title: "Validation error", description: "Please check the form fields", variant: "error" })
                return
            }

            setErrors({})

            const payload: any = {
                name: data.name,
                language_pair: data.language_pair_id,
                currency_id: data.currency_id,
                category: data.category,
            }

            if (hasPagePrice) {
                payload.price_per_page = Number(data.price_per_page)
                payload.price_per_action = null
            } else {
                payload.price_per_page = null
                payload.price_per_action = Number(data.price_per_action)
            }

            if (selectedTariff) {
                await tariffApi.updateTariff(selectedTariff.id, JSON.stringify(payload))
                toast({ title: "Tariff updated", description: `${data.name} updated successfully` })
            } else {
                await tariffApi.createTariff(JSON.stringify(payload))
                toast({ title: "Tariff created", description: `${data.name} created successfully` })
            }

            closeModals()
            await loadTariffs(page)
        } catch (err: any) {
            const detail = err?.response?.data?.language_pair?.[0]
                ?? err?.response?.data?.detail
                ?? "Failed to save tariff"

            if (err?.response?.data?.language_pair) {
                setErrors(prev => ({ ...prev, language_pair_id: detail }))
            }

            toast({ title: "Error", description: detail, variant: "error" })
        }
    }

    return {
        tariffs: allTariffs,
        currencies,
        categories,
        languages,
        languagePairs,
        loading,

        isDeleteOpen,
        openDeleteTariff,
        confirmDelete,

        form,
        setForm,
        errors,

        selectedTariff,
        isFormOpen,
        openAddTariff,
        openEditTariff,
        closeModals,
        submitTariff,

        page,
        totalPages,
        onPageChange,

        isNewPairModalOpen,
        setIsNewPairModalOpen,
        newPairForm,
        setNewPairForm,
        newPairLoading,
        createAndSelectPair,
    }
}