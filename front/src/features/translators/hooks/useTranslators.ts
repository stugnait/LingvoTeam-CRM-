"use client"

import { useCallback, useEffect, useState } from "react"
import { useToast } from "@/src/hooks/use-toast"
import { translatorsApi } from "../api"
import type { Translator, TranslatorPayload } from "../types"

export function useTranslators() {
    const { toast } = useToast()

    // -------------------------
    // State
    // -------------------------
    const [translators, setTranslators] = useState<Translator[]>([])
    const [loading, setLoading] = useState(false)

    const [search, setSearch] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")

    // 🔥 NEW: sorting + filters
    const [ordering, setOrdering] = useState<
        "orders_count" | "-orders_count" | null
    >(null)

    const [sourceLanguage, setSourceLanguage] = useState<number | null>(null)
    const [targetLanguage, setTargetLanguage] = useState<number | null>(null)
    const [languagePairId, setLanguagePairId] = useState<number | null>(null)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const [confirmAction, setConfirmAction] =
        useState<"delete" | "deactivate" | null>(null)

    const [form, setForm] = useState<TranslatorPayload>({
        full_name: "",
        email: "",
        phone: "",
        work_type: 0,
        currency_id: 0,
    })

    const [errors, setErrors] = useState<Partial<Record<keyof TranslatorPayload, string>>>({})

    // modals
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [selectedTranslator, setSelectedTranslator] =
        useState<Translator | null>(null)

    // -------------------------
    // Debounce search
    // -------------------------
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search)
        }, 400)

        return () => clearTimeout(timer)
    }, [search])

    // -------------------------
    // Load translators
    // -------------------------
    const loadTranslators = useCallback(async (pageNumber: number = 1) => {
        try {
            setLoading(true)

            const response = await translatorsApi.list(pageNumber, {
                search: debouncedSearch,
                ordering: ordering || undefined,
                source_language: sourceLanguage || undefined,
                target_language: targetLanguage || undefined,
                language_pair_id: languagePairId || undefined,
            })

            setTranslators(response.results)
            setTotalPages(Math.ceil((response.count || 0) / 10))
            setPage(pageNumber)
        } catch {
            toast({
                title: "Error",
                description: "Failed to load translators",
                variant: "error",
            })
        } finally {
            setLoading(false)
        }
    }, [
        debouncedSearch,
        ordering,
        sourceLanguage,
        targetLanguage,
        languagePairId,
        toast,
    ])

    useEffect(() => {
        loadTranslators(1)
    }, [loadTranslators])

    const onPageChange = (newPage: number) => {
        loadTranslators(newPage)
    }

    // -------------------------
    // Modal handlers
    // -------------------------
    const openAddTranslator = () => {
        setSelectedTranslator(null)
        setForm({
            full_name: "",
            email: "",
            phone: "",
            work_type: 0,
            currency_id: 0,
        })
        setErrors({})
        setIsFormOpen(true)
    }

    const openEditTranslator = (translator: Translator) => {
        setSelectedTranslator(translator)
        setForm({
            full_name: translator.full_name,
            email: translator.email,
            phone: translator.phone,
            work_type: Number(translator.work_type),
            currency_id: translator.currency_id,
        })
        setErrors({})
        setIsFormOpen(true)
    }

    const openDeleteTranslator = (translator: Translator) => {
        setSelectedTranslator(translator)
        setConfirmAction("delete")
        setIsConfirmOpen(true)
    }

    const openDeactivateTranslator = (translator: Translator) => {
        setSelectedTranslator(translator)
        setConfirmAction("deactivate")
        setIsConfirmOpen(true)
    }

    const closeModals = () => {
        setIsFormOpen(false)
        setIsConfirmOpen(false)
        setSelectedTranslator(null)
        setConfirmAction(null)
        setErrors({})
    }

    // -------------------------
    // Submit handlers
    // -------------------------
    const submitTranslator = async (data: TranslatorPayload) => {
        try {
            const newErrors: Partial<Record<keyof TranslatorPayload, string>> = {}

            if (!data.full_name.trim()) {
                newErrors.full_name = "Full name is required"
            }
            if (!data.email.trim()) {
                newErrors.email = "Email is required"
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
                newErrors.email = "Invalid email format"
            }
            if (!data.phone.trim()) {
                newErrors.phone = "Phone is required"
            }
            if (!data.work_type || Number(data.work_type) <= 0) {
                newErrors.work_type = "Please select a work type"
            }
            if (!data.currency_id || Number(data.currency_id) <= 0) {
                newErrors.currency_id = "Please select a currency"
            }

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors)
                toast({
                    title: "Validation error",
                    description: "Please check the form fields",
                    variant: "error",
                })
                return
            }

            setErrors({})

            if (selectedTranslator) {
                await translatorsApi.update(selectedTranslator.id, data)

                toast({
                    title: "Translator updated",
                    description: `${data.full_name} updated successfully`,
                })
            } else {
                await translatorsApi.create(data)

                toast({
                    title: "Translator created",
                    description: `${data.full_name} created successfully`,
                })
            }

            closeModals()
            await loadTranslators(page)
        } catch {
            toast({
                title: "Error",
                description: "Failed to save translator",
                variant: "error",
            })
        }
    }

    const confirmActionHandler = async () => {
        if (!selectedTranslator || !confirmAction) return

        try {
            await translatorsApi.remove(selectedTranslator.id)

            toast({
                title:
                    confirmAction === "delete"
                        ? "Translator deleted"
                        : "Translator deactivated",
                description: selectedTranslator.full_name,
            })

            closeModals()
            await loadTranslators(page)
        } catch {
            toast({
                title: "Error",
                description: "Action failed",
                variant: "error",
            })
        }
    }

    // -------------------------
    // Public API
    // -------------------------
    return {
        translators,
        loading,

        search,
        setSearch,

        // 🔥 NEW
        ordering,
        setOrdering,

        sourceLanguage,
        setSourceLanguage,

        targetLanguage,
        setTargetLanguage,

        languagePairId,
        setLanguagePairId,

        form,
        setForm,
        errors,

        isFormOpen,
        isConfirmOpen,
        confirmAction,
        selectedTranslator,

        openAddTranslator,
        openEditTranslator,
        openDeleteTranslator,
        openDeactivateTranslator,

        submitTranslator,
        confirmActionHandler,
        closeModals,
        page,
        totalPages,
        onPageChange,
    }
}