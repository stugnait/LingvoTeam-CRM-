"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useToast } from "@/src/hooks/use-toast"
import { tariffApi } from "../api"
import type {
    Tariff,
    TariffsFormData,
} from "../types"

export function useTariffs() {
    const { toast } = useToast()

    const [allTariffs, setAllTariffs] = useState<Tariff[]>([])
    const [loading, setLoading] = useState(false)

    const [selectedTariff, setSelectedTariff] = useState<Tariff | null>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)

    const [form, setForm] = useState<TariffsFormData>({
        name: "",
        language_pair: 0,
        currency_id: 0,
        category: 0,
        price_per_page: 0,
        price_per_action: 0,
    })

    // -------------------------
    // Load tariffs
    // -------------------------
    const loadTariffs = useCallback(async () => {
        try {
            setLoading(true)
            const response = await tariffApi.listTariff()
            setAllTariffs(response.results)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load tariffs",
                variant: "error",
            })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        loadTariffs()
    }, [loadTariffs])

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
            price_per_page: 0,
            price_per_action: 0,
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

    const closeModals = () => {
        setIsFormOpen(false)
        setSelectedTariff(null)
    }

    // -------------------------
    // Submit
    // -------------------------
    const submitTariff = async (data: TariffsFormData) => {
        try {
            if (selectedTariff) {
                await tariffApi.updateTariff(
                    selectedTariff.id,
                    JSON.stringify(data)
                )

                toast({
                    title: "Tariff updated",
                    description: `${data.name} updated successfully`,
                })
            } else {
                await tariffApi.createTariff(
                    JSON.stringify(data)
                )

                toast({
                    title: "Tariff created",
                    description: `${data.name} created successfully`,
                })
            }

            closeModals()
            await loadTariffs()
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save tariff",
                variant: "error",
            })
        }
    }

    return {
        tariffs: allTariffs,
        loading,

        form,
        setForm,

        selectedTariff,
        isFormOpen,

        openAddTariff,
        openEditTariff,
        closeModals,
        submitTariff,
    }
}