"use client"

import { useCallback, useEffect, useState } from "react"
import { useToast } from "@/src/hooks/use-toast"
import { financeApi } from "../api"

import {
    TransactionCategory,
    TransactionCategoryPayload
} from "../types"

export function useCategories() {

    const { toast } = useToast()

    // -------------------------
    // State
    // -------------------------
    const [categories, setCategories] = useState<TransactionCategory[]>([])
    const [loading, setLoading] = useState(false)

    const [selectedCategory, setSelectedCategory] =
        useState<TransactionCategory | null>(null)

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)

    const [form, setForm] = useState<TransactionCategoryPayload>({
        name: "",
        type: "expense",
    })

    // -------------------------
    // Load categories
    // -------------------------
    const loadCategories = useCallback(async () => {

        try {

            setLoading(true)

            const data = await financeApi.listCategories()

            setCategories(data.results)

        } catch {

            toast({
                title: "Error",
                description: "Failed to load categories",
                variant: "error",
            })

        } finally {
            setLoading(false)
        }

    }, [toast])


    useEffect(() => {
        loadCategories()
    }, [loadCategories])



    // -------------------------
    // Modal handlers
    // -------------------------

    const openAddCategory = () => {

        setSelectedCategory(null)

        setForm({
            name: "",
            type: "expense",
        })

        setIsFormOpen(true)

    }

    const openEditCategory = (category: TransactionCategory) => {

        setSelectedCategory(category)

        setForm({
            name: category.name,
            type: category.type,
        })

        setIsFormOpen(true)

    }

    const openDeleteCategory = (category: TransactionCategory) => {

        setSelectedCategory(category)

        setIsDeleteOpen(true)

    }

    const closeModals = () => {

        setIsFormOpen(false)
        setIsDeleteOpen(false)

        setSelectedCategory(null)

    }



    // -------------------------
    // Submit
    // -------------------------

    const submitCategory = async () => {

        try {

            if (selectedCategory) {

                await financeApi.updateCategory(
                    selectedCategory.slug,
                    form
                )

                toast({
                    title: "Category updated",
                })

            } else {

                await financeApi.createCategory(form)

                toast({
                    title: "Category created",
                })

            }

            closeModals()

            await loadCategories()

        } catch {

            toast({
                title: "Error",
                description: "Failed to save category",
                variant: "error",
            })

        }

    }



    const confirmDelete = async () => {

        if (!selectedCategory) {return}

        try {

            await financeApi.deleteCategory(
                selectedCategory.slug
            )

            toast({
                title: "Category deleted",
            })

            closeModals()

            await loadCategories()

        } catch {

            toast({
                title: "Error",
                description: "Failed to delete category",
                variant: "error",
            })

        }

    }



    // -------------------------
    // Public API
    // -------------------------

    return {

        categories,
        loading,

        selectedCategory,

        isFormOpen,
        isDeleteOpen,

        form,
        setForm,

        openAddCategory,
        openEditCategory,
        openDeleteCategory,

        submitCategory,
        confirmDelete,
        closeModals,
    }
}