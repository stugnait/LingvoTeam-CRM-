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

    const [confirmAction, setConfirmAction] =
        useState<"delete" | "deactivate" | null>(null)

    const [form, setForm] = useState<TranslatorPayload>({
        full_name: "",
        email: "",
        phone: "",
        work_type: 0,
        currency_id: 0,
    })

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
    const loadTranslators = useCallback(async () => {
        try {
            setLoading(true)

            const response = await translatorsApi.list({
                search: debouncedSearch,
                ordering: ordering || undefined,
                source_language: sourceLanguage || undefined,
                target_language: targetLanguage || undefined,
                language_pair_id: languagePairId || undefined,
            })

            setTranslators(response.results)
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
        loadTranslators()
    }, [loadTranslators])

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
    }

    // -------------------------
    // Submit handlers
    // -------------------------
    const submitTranslator = async (data: TranslatorPayload) => {
        try {
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
            await loadTranslators()
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
            await loadTranslators()
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
    }
}